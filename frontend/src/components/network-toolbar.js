import React, { useMemo, useRef, useState } from 'react';
import {
  Share2,
  ListTree,
  Eye,
  Search,
  Plus,
  Play,
  Settings,
  Store,
  Users,
  UserX,
  Download,
  PanelRight,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getNodeType } from '@/lib/node-types';

const VIEWS = [
  { id: 'graph', label: 'Graph', icon: Share2 },
  { id: 'tree', label: 'Tree', icon: ListTree },
  { id: 'preview', label: 'Preview', icon: Eye },
];

function NodeSearch({ nodes, onPick }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return nodes
      .filter(n => (n.title || n.label || '').toLowerCase().includes(q) || (n.description || '').toLowerCase().includes(q))
      .slice(0, 8);
  }, [nodes, query]);

  const pick = (node) => {
    onPick(node);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative w-full max-w-xs">
      <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        value={query}
        placeholder="Find a node..."
        className="h-8 pl-8"
        onChange={(e) => { setQuery(e.target.value); setActive(0); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
          else if (e.key === 'Enter' && results[active]) { e.preventDefault(); pick(results[active]); }
          else if (e.key === 'Escape') { setQuery(''); inputRef.current?.blur(); }
        }}
      />
      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border bg-popover shadow-lg">
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">No matches</p>
          ) : results.map((n, idx) => (
            <button
              key={n.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(n)}
              className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${idx === active ? 'bg-muted' : 'hover:bg-muted'}`}
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${getNodeType(n.color).dotClass}`} />
              <span className="truncate">{n.title || n.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NetworkToolbar({
  networkName,
  nodes,
  view,
  onViewChange,
  onPickNode,
  onAddNode,
  onStartPractice,
  onOpenSettings,
  panelOpen,
  onTogglePanel,
  published,
  onTogglePublish,
  visibleToFriends,
  onToggleVisibleToFriends,
  onExport,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b bg-background px-3 py-2">
      <h1 className="mr-1 max-w-[14rem] truncate text-base font-semibold" title={networkName}>{networkName}</h1>

      <div className="flex rounded-md border p-0.5" role="tablist" aria-label="View">
        {VIEWS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            onClick={() => onViewChange(id)}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-sm transition-colors ${
              view === id ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {view !== 'preview' && <NodeSearch nodes={nodes} onPick={onPickNode} />}

      <div className="ml-auto flex items-center gap-1.5">
        {view !== 'preview' && (
          <Button variant="outline" size="sm" onClick={onAddNode}><Plus /> Add node</Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {published ? <Store /> : visibleToFriends ? <Users /> : <UserX />}
              Share <ChevronDown className="opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              {published ? 'Listed on the marketplace' : 'Not on the marketplace'} · {visibleToFriends ? 'visible to friends' : 'hidden from friends'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onTogglePublish}>
              <Store /> {published ? 'Unpublish from marketplace' : 'Publish to marketplace'}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onToggleVisibleToFriends}>
              {visibleToFriends ? <UserX /> : <Users />} {visibleToFriends ? 'Hide from friends' : 'Share with friends'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onExport}><Download /> Export as JSON</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onOpenSettings} title="Display settings">
          <Settings />
        </Button>
        {view !== 'preview' && (
          <Button variant={panelOpen ? 'secondary' : 'ghost'} size="icon" className="h-8 w-8" onClick={onTogglePanel} title={panelOpen ? 'Hide panel' : 'Show panel'}>
            <PanelRight />
          </Button>
        )}
        <Button size="sm" onClick={onStartPractice}><Play /> Practice</Button>
      </div>
    </div>
  );
}
