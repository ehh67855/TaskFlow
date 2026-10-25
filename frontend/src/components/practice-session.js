import { BACKEND_API_URL } from "@/config/site";
import React, { useEffect, useMemo, useState } from 'react';
import {
  Play,
  Pause,
  Check,
  ChevronLeft,
  RefreshCw,
  Target,
  Clock,
  Pencil,
  Flag,
  Circle,
  CircleDot,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MDXEditor, MarkdownContent } from '@/components/ui/markdown-editor';
import RatingInput from '@/components/rating-input';
import { getAuthToken, getLogin } from '@/services/BackendService';
import { notifyBadgeCheck } from '@/lib/badge-events';
import { useToast } from '@/hooks/use-toast';

const PRESET_MINUTES = [15, 30, 45, 60, 90];

// Clock-style mm:ss (or h:mm:ss) - negative values are shown as overtime by the caller.
const formatClock = (ms) => {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

const formatMinutes = (ms) => {
  const minutes = Math.round(ms / 60000);
  return minutes < 1 ? '<1 min' : `${minutes} min`;
};

// The whole practice flow in one place, as a sequence of clear steps:
//   setup   - pick how long to practice
//   plan    - review the generated routine before committing to it
//   session - work through it one item at a time, with a timer
//   summary - confirm what was actually practiced, then save it
export default function PracticeSession({ open, onOpenChange, networkId, areaOfFocusNodes = [] }) {
  const { toast } = useToast();
  const [step, setStep] = useState('setup');
  const [minutes, setMinutes] = useState('30');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [routine, setRoutine] = useState(null);
  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Session state, all indexed the same as routine.routineItems.
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remaining, setRemaining] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [practiced, setPracticed] = useState([]);
  const [values, setValues] = useState([]);
  const [running, setRunning] = useState(false);
  // Non-null while the "how did that go?" step for an item is showing.
  const [feedback, setFeedback] = useState(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');

  const items = useMemo(() => routine?.routineItems || [], [routine]);
  const currentItem = items[currentIndex];

  const reset = () => {
    setStep('setup');
    setRoutine(null);
    setErrorMessage('');
    setConfirmExitOpen(false);
    setRunning(false);
    setFeedback(null);
    setEditingNotes(false);
  };

  useEffect(() => {
    if (open) reset();
  }, [open]);

  const hasProgress = step === 'session' || step === 'summary';

  // Anything that would close the dialog mid-session (Escape, the overlay, the X) asks first -
  // there's real progress to lose.
  const requestClose = () => {
    if (hasProgress) {
      setConfirmExitOpen(true);
      return;
    }
    onOpenChange(false);
  };

  const exitSession = () => {
    setConfirmExitOpen(false);
    reset();
    onOpenChange(false);
  };

  // Ticks the current item's timer. Deliberately allowed to go negative once time runs out -
  // running over should never force the user to stop; it just shows as overtime until they
  // mark the item done themselves, which also keeps "how long did this take" accurate.
  useEffect(() => {
    if (step !== 'session' || !running || feedback) return undefined;
    const timer = setInterval(() => {
      setRemaining(prev => {
        const next = [...prev];
        next[currentIndex] = (next[currentIndex] ?? 0) - 1000;
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, running, feedback, currentIndex]);

  useEffect(() => {
    setEditingNotes(false);
    setNotesDraft(currentItem?.nodeDescription || '');
  }, [currentIndex, currentItem]);

  const generate = async () => {
    const parsedMinutes = parseInt(minutes, 10);
    if (!parsedMinutes || parsedMinutes <= 0) {
      setErrorMessage('Enter how many minutes you want to practice.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const authToken = await getAuthToken();
      const login = await getLogin(authToken);
      const response = await fetch(`${BACKEND_API_URL}/create-routine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ networkId, login, totalMinutes: String(parsedMinutes) }),
      });
      if (response.status === 400) {
        setErrorMessage(`Nothing fits into ${parsedMinutes} minutes. Try a longer session, or give some Action nodes shorter times.`);
        return;
      }
      if (!response.ok) throw new Error('Unable to generate routine');
      const data = await response.json();
      if (!data?.routineItems?.length) {
        setErrorMessage('No practice items were found. Add some Action nodes to this network first.');
        return;
      }
      setRoutine(data);
      setStep('plan');
    } catch {
      setErrorMessage('Something went wrong building your routine. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startSession = () => {
    setCurrentIndex(0);
    setRemaining(items.map(item => item.amountOfTime || 0));
    setCompleted(items.map(() => false));
    setPracticed(items.map(() => false));
    setValues(items.map(() => ''));
    setRunning(false);
    setFeedback(null);
    setStep('session');
  };

  const plannedTotal = useMemo(
    () => items.reduce((acc, item) => acc + parseInt(item.amountOfTime || 0, 10), 0),
    [items]
  );
  const timeLeft = remaining.reduce((acc, ms, idx) => acc + (completed[idx] ? 0 : Math.max(ms, 0)), 0);
  const doneCount = completed.filter(Boolean).length;
  const spentMs = (idx) => Math.max((items[idx]?.amountOfTime || 0) - (remaining[idx] ?? 0), 0);

  const goTo = (idx) => {
    setRunning(false);
    setFeedback(null);
    setCurrentIndex(idx);
  };

  const markDone = () => {
    setRunning(false);
    const item = items[currentIndex];
    const spent = spentMs(currentIndex);
    setCompleted(prev => prev.map((v, i) => (i === currentIndex ? true : v)));
    setPracticed(prev => prev.map((v, i) => (i === currentIndex ? true : v)));
    setFeedback({
      priority: item.priority || 0,
      difficulty: item.difficulty || 0,
      areaOfFocus: item.areaOfFocus || false,
      minutes: String(Math.floor(spent / 60000)),
      seconds: String(Math.floor((spent % 60000) / 1000)),
    });
  };

  const advance = () => {
    setFeedback(null);
    const nextIdx = items.findIndex((_, i) => i > currentIndex && !completed[i]);
    const anyLeft = nextIdx !== -1 ? nextIdx : items.findIndex((_, i) => !completed[i] && i !== currentIndex);
    if (anyLeft === -1) {
      setStep('summary');
    } else {
      setCurrentIndex(anyLeft);
    }
  };

  const saveFeedback = async () => {
    const item = items[currentIndex];
    const hasTime = feedback.minutes !== '' || feedback.seconds !== '';
    const payload = {
      id: String(item.nodeId),
      networkId: String(networkId),
      title: item.itemName,
      priority: feedback.priority > 0 ? String(feedback.priority) : null,
      difficulty: feedback.difficulty > 0 ? String(feedback.difficulty) : null,
      estimatedMinutes: hasTime ? String(parseInt(feedback.minutes || 0, 10)) : null,
      estimatedSeconds: hasTime ? String(parseInt(feedback.seconds || 0, 10)) : null,
      isAreaOfFocus: feedback.areaOfFocus ? 'true' : 'false',
      description: item.nodeDescription
    };
    try {
      const res = await fetch(`${BACKEND_API_URL}/save-node`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update node');
      item.priority = feedback.priority;
      item.difficulty = feedback.difficulty;
      item.areaOfFocus = feedback.areaOfFocus;
    } catch {
      toast({ variant: 'destructive', title: 'Failed to update this item.' });
    } finally {
      advance();
    }
  };

  const saveNotes = async () => {
    const item = items[currentIndex];
    const payload = {
      id: String(item.nodeId),
      title: item.itemName,
      priority: String(item.priority || 0),
      difficulty: String(item.difficulty || 0),
      estimatedMinutes: String(Math.floor((item.amountOfTime || 0) / 60000)),
      estimatedSeconds: String(Math.floor(((item.amountOfTime || 0) % 60000) / 1000)),
      isAreaOfFocus: item.areaOfFocus ? 'true' : 'false',
      description: notesDraft,
      networkId: String(networkId)
    };
    try {
      const res = await fetch(`${BACKEND_API_URL}/save-node`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to update node description');
      item.nodeDescription = notesDraft;
      setEditingNotes(false);
    } catch {
      toast({ variant: 'destructive', title: 'Failed to save these notes.' });
    }
  };

  const saveSession = async () => {
    if (!practiced.some(Boolean)) return;
    setSaving(true);
    try {
      const authToken = await getAuthToken();
      const login = await getLogin(authToken);
      // Only items actually practiced are sent - saving one is what counts it toward the
      // node's practice history. Only items with their own quantifier (and an entered value)
      // get an achievedValue; everything else sends null so the backend can tell "not
      // applicable" apart from "the user entered 0".
      const routineItems = items
        .map((item, idx) => ({
          ...item,
          achievedValue: item.quantifierLabel && values[idx] !== undefined && values[idx] !== ''
            ? parseFloat(values[idx])
            : null,
        }))
        .filter((item, idx) => practiced[idx] && item.nodeId !== null && item.nodeId !== undefined);
      const res = await fetch(`${BACKEND_API_URL}/save-routine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, networkId, totalMinutes: minutes, routineItems }),
      });
      if (!res.ok) throw new Error('Failed to submit routine');
      // Fired before the toast so a badge-unlock notification triggered by this same
      // submission isn't stuck waiting behind it.
      notifyBadgeCheck();
      toast({ title: 'Session saved', description: 'Nice work - your progress has been recorded.' });
      reset();
      onOpenChange(false);
    } catch {
      toast({ variant: 'destructive', title: 'Something went wrong', description: 'Failed to save your session. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const renderSetup = () => (
    <div className="mx-auto w-full max-w-md space-y-6 py-4">
      <div className="space-y-3">
        <Label className="text-base">How long do you want to practice?</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_MINUTES.map(m => (
            <Button
              key={m}
              type="button"
              variant={String(m) === minutes ? 'default' : 'outline'}
              onClick={() => setMinutes(String(m))}
            >
              {m} min
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="1"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') generate(); }}
            className="w-24"
            aria-label="Minutes"
          />
          <span className="text-sm text-muted-foreground">minutes</span>
        </div>
      </div>

      {areaOfFocusNodes.length > 0 && (
        <div className="space-y-2 rounded-md border p-3">
          <p className="flex items-center gap-1.5 text-sm font-medium"><Target size={14} /> Your areas of focus get priority</p>
          <div className="flex flex-wrap gap-1.5">
            {areaOfFocusNodes.map(node => (
              <span key={node.id} className="rounded-full bg-muted px-2 py-0.5 text-xs">{node.title}</span>
            ))}
          </div>
        </div>
      )}

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <Button className="w-full" size="lg" onClick={generate} disabled={loading}>
        {loading ? <><RefreshCw className="animate-spin" /> Building your routine...</> : 'Build my routine'}
      </Button>
    </div>
  );

  const renderPlan = () => (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>{items.length} item{items.length === 1 ? '' : 's'}</span>
        <span className="flex items-center gap-1"><Clock size={14} /> {formatMinutes(plannedTotal)} total</span>
      </div>
      <ol className="min-h-0 flex-1 divide-y overflow-y-auto rounded-md border">
        {items.map((item, idx) => (
          <li key={item.id ?? idx} className="flex items-center gap-3 px-3 py-2.5">
            <span className="w-5 text-right text-sm tabular-nums text-muted-foreground">{idx + 1}</span>
            <span className={`flex-1 truncate ${item.areaOfFocus ? 'font-semibold' : ''}`}>{item.itemName}</span>
            {item.areaOfFocus && <Target size={14} className="text-amber-500" aria-label="Area of focus" />}
            {item.quantifierLabel && <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{item.quantifierLabel}</span>}
            <span className="w-16 text-right text-sm tabular-nums text-muted-foreground">{formatClock(item.amountOfTime || 0)}</span>
          </li>
        ))}
      </ol>
      {errorMessage && <p className="mt-2 text-sm text-destructive">{errorMessage}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button variant="ghost" onClick={() => setStep('setup')}><ChevronLeft /> Change time</Button>
        <Button variant="outline" onClick={generate} disabled={loading}>
          <RefreshCw className={loading ? 'animate-spin' : ''} /> Try another mix
        </Button>
        <Button className="ml-auto" size="lg" onClick={startSession}><Play /> Start practicing</Button>
      </div>
    </div>
  );

  const renderFeedback = () => (
    <div className="space-y-5">
      <div>
        <p className="text-lg font-semibold">Nice work!</p>
        <p className="text-sm text-muted-foreground">
          You spent <strong className="text-foreground">{formatClock(spentMs(currentIndex))}</strong> on this. Want to adjust anything for next time? (optional)
        </p>
      </div>
      <div className="grid max-w-sm grid-cols-[6rem_1fr] items-center gap-y-3 text-sm">
        <span>Priority</span>
        <RatingInput label="Priority" value={feedback.priority} onChange={(v) => setFeedback(f => ({ ...f, priority: v }))} />
        <span>Difficulty</span>
        <RatingInput label="Difficulty" value={feedback.difficulty} onChange={(v) => setFeedback(f => ({ ...f, difficulty: v }))} />
        <span>Time</span>
        <div className="flex items-center gap-1.5">
          <Input type="number" min="0" value={feedback.minutes} onChange={(e) => setFeedback(f => ({ ...f, minutes: e.target.value }))} className="h-8 w-16" aria-label="Minutes" />
          <span className="text-muted-foreground">:</span>
          <Input type="number" min="0" max="59" value={feedback.seconds} onChange={(e) => setFeedback(f => ({ ...f, seconds: e.target.value }))} className="h-8 w-16" aria-label="Seconds" />
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox checked={feedback.areaOfFocus} onCheckedChange={() => setFeedback(f => ({ ...f, areaOfFocus: !f.areaOfFocus }))} />
        Keep as an area of focus
      </label>
      <div className="flex gap-2">
        <Button onClick={saveFeedback}>Save &amp; continue</Button>
        <Button variant="ghost" onClick={advance}>Skip</Button>
      </div>
    </div>
  );

  const renderSession = () => {
    const itemTotal = currentItem?.amountOfTime || 1;
    const itemRemaining = remaining[currentIndex] ?? 0;
    const overtime = itemRemaining < 0;
    const isDone = completed[currentIndex];

    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4 md:flex-row">
        <aside className="flex shrink-0 flex-col md:w-64">
          <div className="mb-2 space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{doneCount} of {items.length} done</span>
              <span>{formatMinutes(timeLeft)} left</span>
            </div>
            <Progress value={(doneCount / items.length) * 100} />
          </div>
          <ol className="max-h-40 overflow-y-auto md:max-h-none md:flex-1">
            {items.map((item, idx) => (
              <li key={item.id ?? idx}>
                <button
                  type="button"
                  onClick={() => goTo(idx)}
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${idx === currentIndex ? 'bg-muted font-medium' : 'hover:bg-muted/60'}`}
                >
                  {completed[idx]
                    ? <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                    : idx === currentIndex
                      ? <CircleDot size={16} className="shrink-0 text-primary" />
                      : <Circle size={16} className="shrink-0 text-muted-foreground/50" />}
                  <span className={`flex-1 truncate ${completed[idx] ? 'text-muted-foreground line-through' : ''}`}>{item.itemName}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{formatClock(item.amountOfTime || 0)}</span>
                </button>
              </li>
            ))}
          </ol>
          <Button variant="outline" className="mt-2" onClick={() => { setRunning(false); setFeedback(null); setStep('summary'); }}>
            <Flag /> Finish session
          </Button>
        </aside>

        <section className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-lg border p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Item {currentIndex + 1} of {items.length}</p>
          <h3 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
            {currentItem.itemName}
            {currentItem.areaOfFocus && <Target size={18} className="text-amber-500" aria-label="Area of focus" />}
          </h3>

          {feedback ? (
            <div className="mt-6">{renderFeedback()}</div>
          ) : (
            <>
              <div className="mt-6 flex flex-col items-center gap-3">
                <div className={`text-6xl font-semibold tabular-nums ${overtime ? 'text-amber-500' : ''}`}>
                  {overtime ? '+' : ''}{formatClock(itemRemaining)}
                </div>
                <Progress value={Math.min(100, Math.max(0, (1 - itemRemaining / itemTotal) * 100))} className="h-1.5 w-full max-w-sm" />
                {overtime && <p className="text-sm text-amber-600 dark:text-amber-400">Over time - keep going if you&apos;re not done.</p>}
                <div className="mt-2 flex gap-2">
                  {isDone ? (
                    <p className="flex items-center gap-1.5 text-sm text-emerald-600"><Check size={16} /> Done</p>
                  ) : (
                    <>
                      <Button size="lg" variant={running ? 'outline' : 'default'} onClick={() => setRunning(r => !r)} className="min-w-32">
                        {running ? <><Pause /> Pause</> : <><Play /> {itemRemaining === itemTotal ? 'Start' : 'Resume'}</>}
                      </Button>
                      <Button size="lg" variant={running ? 'default' : 'outline'} onClick={markDone}>
                        <Check /> Done
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {currentItem.quantifierLabel && (
                <div className="mx-auto mt-6 flex items-center gap-2">
                  <Label htmlFor="practice-value">{currentItem.quantifierLabel}</Label>
                  <Input
                    id="practice-value"
                    type="number"
                    value={values[currentIndex] ?? ''}
                    onChange={(e) => setValues(prev => prev.map((v, i) => (i === currentIndex ? e.target.value : v)))}
                    className="w-28"
                  />
                </div>
              )}

              <div className="mt-8 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</h4>
                  {!editingNotes && (
                    <Button variant="ghost" size="sm" className="h-7" onClick={() => setEditingNotes(true)}><Pencil /> Edit</Button>
                  )}
                </div>
                {editingNotes ? (
                  <div className="space-y-2">
                    <MDXEditor value={notesDraft} onChange={setNotesDraft} height="220px" showPreview={false} />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={saveNotes}>Save notes</Button>
                      <Button size="sm" variant="ghost" onClick={() => { setNotesDraft(currentItem.nodeDescription || ''); setEditingNotes(false); }}>Cancel</Button>
                    </div>
                  </div>
                ) : currentItem.nodeDescription ? (
                  <MarkdownContent content={currentItem.nodeDescription} />
                ) : (
                  <p className="text-sm text-muted-foreground">No notes for this item.</p>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    );
  };

  const renderSummary = () => (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="mb-3 text-sm text-muted-foreground">Check off everything you practiced - only those items count toward your progress.</p>
      <ul className="min-h-0 flex-1 divide-y overflow-y-auto rounded-md border">
        {items.map((item, idx) => (
          <li key={item.id ?? idx}>
            <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
              <Checkbox
                checked={practiced[idx]}
                onCheckedChange={() => setPracticed(prev => prev.map((v, i) => (i === idx ? !v : v)))}
              />
              <span className="flex-1 truncate">{item.itemName}</span>
              {item.quantifierLabel && values[idx] !== '' && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs">{values[idx]} {item.quantifierLabel}</span>
              )}
              <span className="w-16 text-right text-sm tabular-nums text-muted-foreground">{formatClock(spentMs(idx))}</span>
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {doneCount < items.length && (
          <Button variant="ghost" onClick={() => setStep('session')}><ChevronLeft /> Back to session</Button>
        )}
        <span className="ml-auto text-sm text-muted-foreground">{practiced.filter(Boolean).length} of {items.length} practiced</span>
        <Button size="lg" onClick={saveSession} disabled={saving || !practiced.some(Boolean)}>
          {saving ? 'Saving...' : 'Save session'}
        </Button>
      </div>
    </div>
  );

  const titles = {
    setup: ['Practice session', 'We’ll build a routine from your Action nodes that fits your time.'],
    plan: ['Your routine', 'Here’s the plan. Start when you’re ready, or try a different mix.'],
    session: ['Practicing', null],
    summary: ['Session summary', null],
  };
  const [title, subtitle] = titles[step];
  const isLarge = step === 'session' || step === 'summary' || step === 'plan';

  return (
    <>
      <Dialog open={open} onOpenChange={(next) => { if (!next) requestClose(); }}>
        <DialogContent
          className={`flex flex-col ${isLarge ? 'h-[85vh] max-w-5xl' : 'max-w-xl'}`}
          // Space bar / arrow keys inside the session shouldn't leak to the graph's shortcuts.
          onKeyDown={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {subtitle ? <DialogDescription>{subtitle}</DialogDescription> : <DialogDescription className="sr-only">{title}</DialogDescription>}
          </DialogHeader>
          {step === 'setup' && renderSetup()}
          {step === 'plan' && renderPlan()}
          {step === 'session' && currentItem && renderSession()}
          {step === 'summary' && renderSummary()}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmExitOpen} onOpenChange={setConfirmExitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this session?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress hasn&apos;t been saved yet and will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep practicing</AlertDialogCancel>
            <AlertDialogAction onClick={exitSession}>Leave</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
