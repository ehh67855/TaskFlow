import { BACKEND_API_URL } from "@/config/site";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronRight,
  Plus,
  MoreHorizontal,
  Trash2,
  Scissors,
  X,
  Maximize2,
  Minimize2,
  Pencil,
  Eye,
  Play,
  Target,
  MousePointerClick,
  Keyboard,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { MDXEditor, MarkdownContent } from '@/components/ui/markdown-editor';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import RatingInput from '@/components/rating-input';
import { useToast } from '@/hooks/use-toast';
import {
  ROOT_COLOR,
  ACTION_COLOR,
  CATEGORY_COLOR,
  INFO_COLOR,
  NODE_TYPES,
  getNodeType,
  parseISODuration,
} from '@/lib/node-types';

const DRAFT_KEY_PREFIX = 'nodeDraft:';

// What the form would show for this node with nothing unsaved - the baseline that "is there
// unsaved work?" gets compared against, and what a draft is compared against too (a draft that
// matches this exactly isn't worth keeping around).
const snapshotFromNode = (node) => {
  if (!node) {
    return {
      title: "", description: "", nodeType: ACTION_COLOR, priorityRating: 0, difficultyRating: 0,
      estimatedMinutes: "", estimatedSeconds: "", isAreaOfFocus: false, quantifierLabel: ""
    };
  }
  const duration = parseISODuration(node.estimatedAmountOfTime);
  // Anything other than a recognized type falls back to Action - but that fallback must never
  // silently swallow a real type (re-opening an Info node and saving without touching the type
  // picker would otherwise quietly convert it).
  const knownType = node.color === CATEGORY_COLOR || node.color === INFO_COLOR ? node.color : ACTION_COLOR;
  return {
    title: node.label === "Inactive" ? "" : node.title || "",
    description: node.description || "",
    nodeType: knownType,
    priorityRating: node.priority || 0,
    difficultyRating: node.difficulty || 0,
    estimatedMinutes: duration ? duration.hours * 60 + duration.minutes : "",
    estimatedSeconds: duration ? duration.seconds : "",
    isAreaOfFocus: node.areaOfFocus || false,
    quantifierLabel: node.quantifierLabel || "",
  };
};

const readDraft = (nodeId) => {
  try {
    const saved = localStorage.getItem(`${DRAFT_KEY_PREFIX}${nodeId}`);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.warn('Could not read saved draft for this node, ignoring it.', e);
    return null;
  }
};

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = isMac ? '⌘' : 'Ctrl+';

function Section({ title, action, children }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
        {action}
      </div>
      {children}
    </section>
  );
}

function TypeDot({ color, className = '' }) {
  return <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${getNodeType(color).dotClass} ${className}`} />;
}

function NodeLink({ node, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(node)}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
    >
      <TypeDot color={node.color} />
      <span className={`truncate ${node.areaOfFocus ? 'font-semibold' : ''}`}>{node.title || node.label || 'Untitled'}</span>
      <ChevronRight size={14} className="ml-auto shrink-0 text-muted-foreground" />
    </button>
  );
}

// The right-hand panel of the network editor. Shows one of three things:
//  - nothing selected: an overview of the network (stats, areas of focus, how to get around)
//  - creating (isCreating): a form for a brand-new node - nothing is persisted, or shown
//    anywhere in the app, unless it's actually submitted
//  - a node selected: that node's content, editable in place (no separate dialog)
export default function NodeInspector({
  networkId,
  networkName,
  nodes,
  edges,
  selectedNode,
  isCreating,
  createParentId,
  onCancelCreate,
  onNodeCreated,
  onSave,
  onSelectNode,
  onAddChild,
  onDelete,
  onSplit,
  onStartPractice,
  focusTitleSignal,
  wide,
  onToggleWide,
  onClose,
}) {
  const { toast } = useToast();
  const titleRef = useRef(null);
  const [form, setForm] = useState(() => snapshotFromNode(null));
  // Which node `form` currently holds - the draft effect below only trusts `form` once this
  // matches the selection, so a just-switched selection never gets the previous node's fields
  // written out as its draft during the render in between.
  const [formKey, setFormKey] = useState(null);
  const [descMode, setDescMode] = useState('preview');
  const [isSaving, setIsSaving] = useState(false);
  const baselineRef = useRef(snapshotFromNode(null));

  const nodesById = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);
  const isRoot = selectedNode?.color === ROOT_COLOR;
  const mode = isCreating ? 'create' : selectedNode ? (isRoot ? 'root' : 'edit') : 'overview';
  const targetKey = isCreating ? `create:${createParentId ?? 'top'}` : selectedNode ? `node:${selectedNode.id}` : null;

  const setField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Load the form whenever the selection (or the selected node's saved data - e.g. after an
  // undo) changes. Unsaved edits for an existing node are restored from its draft, so clicking
  // away to another node and back never loses work.
  useEffect(() => {
    if (mode !== 'create' && mode !== 'edit') {
      setFormKey(targetKey);
      return;
    }
    const fresh = snapshotFromNode(isCreating ? null : selectedNode);
    baselineRef.current = fresh;
    const draft = isCreating ? null : readDraft(selectedNode.id);
    const toApply = draft || fresh;
    setForm(toApply);
    setFormKey(targetKey);
    setDescMode(isCreating || !toApply.description ? 'write' : 'preview');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNode, isCreating, createParentId]);

  useEffect(() => {
    if (isCreating) titleRef.current?.focus();
  }, [isCreating, createParentId]);

  useEffect(() => {
    if (focusTitleSignal) titleRef.current?.focus();
  }, [focusTitleSignal]);

  const formReady = formKey === targetKey;
  const dirty = mode === 'edit' && formReady && JSON.stringify(form) !== JSON.stringify(baselineRef.current);

  // Keeps the draft in localStorage current as you type, and warns before an accidental
  // refresh/close/navigation while there's unsaved work.
  useEffect(() => {
    if (mode !== 'edit' || !formReady) return undefined;
    const key = `${DRAFT_KEY_PREFIX}${selectedNode.id}`;
    if (!dirty) {
      localStorage.removeItem(key);
      return undefined;
    }
    localStorage.setItem(key, JSON.stringify(form));
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [mode, formReady, dirty, form, selectedNode]);

  const discard = () => {
    if (selectedNode) localStorage.removeItem(`${DRAFT_KEY_PREFIX}${selectedNode.id}`);
    setForm(baselineRef.current);
    setDescMode(baselineRef.current.description ? 'preview' : 'write');
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (mode !== 'create' && mode !== 'edit') return;
    if (mode === 'edit' && !dirty) return;

    const {
      title, description, nodeType, priorityRating, difficultyRating,
      estimatedMinutes, estimatedSeconds, isAreaOfFocus, quantifierLabel
    } = form;

    if (!title.trim()) {
      toast({ variant: "destructive", title: "Please enter a title" });
      titleRef.current?.focus();
      return;
    }

    const hasTime = estimatedMinutes !== "" || estimatedSeconds !== "";
    const estimatedAmountOfTime = hasTime
      ? `PT${parseInt(estimatedMinutes || 0)}M${parseInt(estimatedSeconds || 0)}S`
      : null;

    if (mode === 'create') {
      // Unlike editing, this can't be optimistic - there's no id for anything (graph, tree,
      // local state) to reference until the backend actually assigns one. If it fails, the
      // form stays open with everything still typed in, rather than losing it.
      const payload = {
        id: null,
        parentNodeId: createParentId || null,
        title,
        label: title,
        color: nodeType,
        priority: priorityRating > 0 ? priorityRating : null,
        difficulty: difficultyRating > 0 ? difficultyRating : null,
        estimatedMinutes: hasTime ? parseInt(estimatedMinutes || 0) : null,
        estimatedSeconds: hasTime ? parseInt(estimatedSeconds || 0) : null,
        isAreaOfFocus,
        description: description || null,
        quantifierLabel: quantifierLabel.trim(),
        networkId
      };

      setIsSaving(true);
      fetch(`${BACKEND_API_URL}/save-node`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then((res) => res.ok ? res.json() : Promise.reject(res.status))
        .then((data) => onNodeCreated(data.node, data.edge))
        .catch((error) => {
          console.log(error);
          toast({ variant: "destructive", title: "Failed to create this node.", description: "Please try again." });
        })
        .finally(() => setIsSaving(false));
      return;
    }

    // Local/optimistic state always keeps numeric priority/difficulty (0 = unset), matching
    // what the backend actually stores - a node whose rating was never set has an int default
    // of 0, never null.
    const updatedNode = {
      ...selectedNode,
      id: selectedNode.id,
      title,
      label: title,
      color: nodeType,
      priority: priorityRating,
      difficulty: difficultyRating,
      estimatedAmountOfTime,
      areaOfFocus: isAreaOfFocus,
      isAreaOfFocus,
      description,
      quantifierLabel: quantifierLabel.trim() || null,
      networkId
    };

    localStorage.removeItem(`${DRAFT_KEY_PREFIX}${selectedNode.id}`);
    onSave(updatedNode);

    // The backend payload uses null to mean "leave the existing value alone" for fields the
    // user left untouched, so it's built separately from the optimistic local node above.
    const payload = {
      ...updatedNode,
      priority: priorityRating > 0 ? priorityRating : null,
      difficulty: difficultyRating > 0 ? difficultyRating : null,
      estimatedMinutes: hasTime ? parseInt(estimatedMinutes || 0) : null,
      estimatedSeconds: hasTime ? parseInt(estimatedSeconds || 0) : null,
      // Sent as a (possibly empty) string, not null - the backend uses non-null-ness to
      // decide whether to touch this field at all, so an empty string is how "the user
      // cleared it" gets distinguished from "never touched".
      quantifierLabel: quantifierLabel.trim()
    };

    fetch(`${BACKEND_API_URL}/save-node`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => res.ok ? res.json() : Promise.reject(res.status))
      .catch((error) => {
        console.log(error);
        toast({ variant: "destructive", title: "Couldn't save your changes.", description: "Please try again." });
      });
  };

  const handleKeyDown = (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key.toLowerCase() === 's' || e.key === 'Enter')) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape' && mode === 'create') {
      e.preventDefault();
      onCancelCreate();
    }
  };

  // Parent chain for the breadcrumb - follows the first incoming edge at each step, stopping
  // at a node with no parent (or one already seen, in case the graph has a cycle). When
  // creating, the chain starts at the node the new one will be added under.
  const breadcrumb = useMemo(() => {
    const chain = [];
    const seen = new Set();
    let currentId = isCreating ? createParentId : edges.find(e => e.to === selectedNode?.id)?.from;
    while (currentId != null && !seen.has(currentId) && chain.length < 8) {
      seen.add(currentId);
      const n = nodesById.get(currentId);
      if (!n) break;
      chain.unshift(n);
      currentId = edges.find(e => e.to === currentId)?.from;
    }
    return chain;
  }, [isCreating, createParentId, selectedNode, edges, nodesById]);

  const children = useMemo(() => {
    if (!selectedNode) return [];
    return edges
      .filter(e => e.from === selectedNode.id)
      .map(e => nodesById.get(e.to))
      .filter(Boolean);
  }, [selectedNode, edges, nodesById]);

  const stats = useMemo(() => {
    const count = (color) => nodes.filter(n => n.color === color).length;
    return {
      actions: count(ACTION_COLOR),
      categories: count(CATEGORY_COLOR),
      info: count(INFO_COLOR),
      focus: nodes.filter(n => n.areaOfFocus && n.color !== ROOT_COLOR),
    };
  }, [nodes]);

  const header = (
    <div className="flex items-center gap-1 border-b px-3 py-2 shrink-0">
      <div className="flex min-w-0 flex-1 items-center gap-1 text-xs text-muted-foreground">
        {mode === 'overview' ? (
          <span className="font-medium text-foreground">Overview</span>
        ) : (
          <>
            {breadcrumb.map((n) => (
              <React.Fragment key={n.id}>
                <button type="button" className="max-w-[8rem] truncate hover:text-foreground hover:underline" onClick={() => onSelectNode(n)}>
                  {n.title || n.label}
                </button>
                <ChevronRight size={12} className="shrink-0" />
              </React.Fragment>
            ))}
            <span className="truncate font-medium text-foreground">
              {mode === 'create' ? 'New node' : selectedNode.title || selectedNode.label}
            </span>
          </>
        )}
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleWide} title={wide ? 'Narrow panel' : 'Widen panel'}>
        {wide ? <Minimize2 /> : <Maximize2 />}
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Hide panel">
        <X />
      </Button>
    </div>
  );

  if (mode === 'overview') {
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <div>
            <h2 className="text-lg font-semibold leading-tight">{networkName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {stats.actions} practice item{stats.actions === 1 ? '' : 's'} · {stats.categories} categor{stats.categories === 1 ? 'y' : 'ies'} · {stats.info} note{stats.info === 1 ? '' : 's'}
            </p>
          </div>

          <Button className="w-full" size="lg" onClick={onStartPractice} disabled={stats.actions === 0}>
            <Play /> Start a practice session
          </Button>
          {stats.actions === 0 && (
            <p className="-mt-4 text-xs text-muted-foreground">Add at least one Action node to practice.</p>
          )}

          <Section title="Areas of focus">
            {stats.focus.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                None yet. Mark a node as an area of focus and practice sessions will favor it.
              </p>
            ) : (
              <div className="-mx-2">
                {stats.focus.map(n => <NodeLink key={n.id} node={n} onSelect={onSelectNode} />)}
              </div>
            )}
          </Section>

          <Section title="Node types">
            <ul className="space-y-2">
              {NODE_TYPES.map(t => (
                <li key={t.color} className="flex gap-2 text-sm">
                  <TypeDot color={t.color} className="mt-1.5" />
                  <span><span className="font-medium">{t.label}</span> <span className="text-muted-foreground">- {t.hint}</span></span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="Getting around">
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex gap-2"><MousePointerClick size={16} className="mt-0.5 shrink-0" /> Click a node to read and edit it here. Double-click empty space to add a node.</li>
              <li className="flex gap-2"><Keyboard size={16} className="mt-0.5 shrink-0" />
                <span>
                  <kbd className="kbd">N</kbd> new node · <kbd className="kbd">Arrows</kbd> move between nodes · <kbd className="kbd">{MOD}Z</kbd> undo · <kbd className="kbd">Del</kbd> delete · <kbd className="kbd">{MOD}C</kbd>/<kbd className="kbd">{MOD}V</kbd> copy &amp; paste
                </span>
              </li>
            </ul>
          </Section>
        </div>
      </div>
    );
  }

  if (mode === 'root') {
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="flex-1 space-y-6 overflow-y-auto p-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><TypeDot color={ROOT_COLOR} /> Root</div>
            <h2 className="mt-1 text-lg font-semibold">{networkName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Everything in this network branches out from here.</p>
          </div>
          <Section title={`Contains (${children.length})`} action={
            <Button variant="ghost" size="sm" className="h-7" onClick={onAddChild}><Plus /> Add</Button>
          }>
            <div className="-mx-2">
              {children.map(n => <NodeLink key={n.id} node={n} onSelect={onSelectNode} />)}
            </div>
          </Section>
        </div>
      </div>
    );
  }

  const isAction = form.nodeType === ACTION_COLOR;
  const typeInfo = getNodeType(form.nodeType);

  return (
    <form className="flex h-full flex-col" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
      {header}

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="space-y-3">
          <Input
            ref={titleRef}
            value={form.title}
            onChange={(e) => setField('title', e.target.value)}
            placeholder={mode === 'create' ? 'Name this node...' : 'Untitled'}
            aria-label="Title"
            className="h-auto border-transparent px-1 py-1 text-lg font-semibold shadow-none hover:border-input focus-visible:border-input"
          />
          {mode === 'create' && createParentId != null && breadcrumb.length > 0 && (
            <p className="px-1 text-xs text-muted-foreground">
              Will be added under <span className="font-medium text-foreground">{breadcrumb[breadcrumb.length - 1].title || breadcrumb[breadcrumb.length - 1].label}</span>
            </p>
          )}

          <div className="flex rounded-md border p-0.5" role="radiogroup" aria-label="Type">
            {NODE_TYPES.map(t => (
              <button
                key={t.color}
                type="button"
                role="radio"
                aria-checked={form.nodeType === t.color}
                onClick={() => setField('nodeType', t.color)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1 text-sm transition-colors ${
                  form.nodeType === t.color ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TypeDot color={t.color} />
                {t.label}
              </button>
            ))}
          </div>
          <p className="px-1 text-xs text-muted-foreground">{typeInfo.hint}</p>
        </div>

        <Section
          title="Notes"
          action={
            <div className="flex rounded-md border p-0.5 text-xs">
              <button type="button" onClick={() => setDescMode('preview')}
                className={`flex items-center gap-1 rounded px-2 py-0.5 ${descMode === 'preview' ? 'bg-muted font-medium' : 'text-muted-foreground'}`}>
                <Eye size={12} /> Preview
              </button>
              <button type="button" onClick={() => setDescMode('write')}
                className={`flex items-center gap-1 rounded px-2 py-0.5 ${descMode === 'write' ? 'bg-muted font-medium' : 'text-muted-foreground'}`}>
                <Pencil size={12} /> Write
              </button>
            </div>
          }
        >
          {descMode === 'write' ? (
            <MDXEditor
              value={form.description}
              onChange={(v) => setField('description', v)}
              placeholder="Notes, instructions, links... (Markdown supported)"
              height={wide ? '420px' : '260px'}
              showPreview={false}
            />
          ) : form.description ? (
            <div
              className="cursor-text rounded-md border border-transparent p-2 -m-2 hover:border-border"
              onDoubleClick={() => setDescMode('write')}
              title="Double-click to edit"
            >
              <MarkdownContent content={form.description} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setDescMode('write')}
              className="w-full rounded-md border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted"
            >
              No notes yet - click to add some
            </button>
          )}
        </Section>

        {isAction ? (
          <Section title="Practice settings">
            <div className="space-y-4 rounded-md border p-3">
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  checked={form.isAreaOfFocus}
                  onCheckedChange={() => setField('isAreaOfFocus', !form.isAreaOfFocus)}
                  className="mt-0.5"
                />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-medium"><Target size={14} /> Area of focus</span>
                  <span className="block text-xs text-muted-foreground">Practice sessions will favor this item.</span>
                </span>
              </label>

              <div className="grid grid-cols-[6rem_1fr] items-center gap-y-3 text-sm">
                <span>Priority</span>
                <RatingInput label="Priority" value={form.priorityRating} onChange={(v) => setField('priorityRating', v)} />
                <span>Difficulty</span>
                <RatingInput label="Difficulty" value={form.difficultyRating} onChange={(v) => setField('difficultyRating', v)} />
                <span>Time</span>
                <div className="flex items-center gap-1.5">
                  <Input type="number" min="0" value={form.estimatedMinutes} onChange={(e) => setField('estimatedMinutes', e.target.value)} placeholder="min" className="h-8 w-16" aria-label="Minutes" />
                  <span className="text-muted-foreground">:</span>
                  <Input type="number" min="0" max="59" value={form.estimatedSeconds} onChange={(e) => setField('estimatedSeconds', e.target.value)} placeholder="sec" className="h-8 w-16" aria-label="Seconds" />
                </div>
              </div>
              <p className="-mt-2 text-xs text-muted-foreground">Leave time blank and routines will pick a sensible duration.</p>

              <div className="space-y-1">
                <Label htmlFor="quantifierLabel" className="text-sm font-normal">Track a value</Label>
                <Input
                  id="quantifierLabel"
                  value={form.quantifierLabel}
                  onChange={(e) => setField('quantifierLabel', e.target.value)}
                  placeholder="e.g. BPM, reps, seconds held"
                  className="h-8"
                />
                <p className="text-xs text-muted-foreground">
                  {form.quantifierLabel.trim()
                    ? `You'll log a ${form.quantifierLabel.trim()} each time you practice this.`
                    : 'Optional - log a number each time you practice this.'}
                </p>
              </div>
            </div>
          </Section>
        ) : null}

        {mode === 'edit' && (
          <Section title={`Contains (${children.length})`} action={
            <Button type="button" variant="ghost" size="sm" className="h-7" onClick={onAddChild}><Plus /> Add</Button>
          }>
            {children.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing under this node yet.</p>
            ) : (
              <div className="-mx-2">
                {children.map(n => <NodeLink key={n.id} node={n} onSelect={onSelectNode} />)}
              </div>
            )}
          </Section>
        )}
      </div>

      <div className="flex items-center gap-2 border-t px-3 py-2 shrink-0">
        {mode === 'create' ? (
          <>
            <span className="text-xs text-muted-foreground">{MOD}Enter to create · Esc to cancel</span>
            <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={onCancelCreate}>Cancel</Button>
            <Button type="submit" size="sm" disabled={isSaving}>{isSaving ? 'Creating...' : 'Create'}</Button>
          </>
        ) : dirty ? (
          <>
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Unsaved changes</span>
            <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={discard}>Discard</Button>
            <Button type="submit" size="sm">Save <span className="opacity-60">{MOD}S</span></Button>
          </>
        ) : (
          <>
            <Button type="button" variant="outline" size="sm" onClick={onAddChild}><Plus /> Add child</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="ml-auto h-8 w-8" aria-label="More actions"><MoreHorizontal /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(selectedNode.color === CATEGORY_COLOR || selectedNode.color === INFO_COLOR) && (
                  <>
                    <DropdownMenuItem onSelect={onSplit}><Scissors /> Split into new network</DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onSelect={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 /> Delete node
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </form>
  );
}
