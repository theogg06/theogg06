/**
 * Design-system candidate components built on React Aria Components
 * (no packages/tokens components existed — DECISIONS.md D-003/D-041).
 */
import { useEffect, useState, type ReactNode } from 'react';
import {
  Button as RACButton, type ButtonProps as RACButtonProps, Tooltip, TooltipTrigger, ToggleButton, ToggleButtonGroup,
  Dialog, Heading, Modal, ModalOverlay, type ModalOverlayProps,
} from 'react-aria-components';
import { Icon, type IconName } from './Icon';
import { dismissToast, useToasts } from '../state/toasts';
import { useAnnouncements } from '../state/announcer';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({ variant = 'secondary', icon, children, className, ...rest }: RACButtonProps & { variant?: Variant; icon?: IconName; children: ReactNode }) {
  return (
    <RACButton {...rest} className={`btn btn--${variant} ${className ?? ''}`}>
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </RACButton>
  );
}

/** Icon-only button: accessible name = label; same text shown as a tooltip on hover AND focus. */
export function IconButton({ icon, label, ...rest }: RACButtonProps & { icon: IconName; label: string }) {
  return (
    <TooltipTrigger delay={400} closeDelay={150}>
      <RACButton {...rest} aria-label={label} className="btn btn--icon">
        <Icon name={icon} />
      </RACButton>
      <Tooltip className="ui-tooltip" offset={6}>{label}</Tooltip>
    </TooltipTrigger>
  );
}

export type BadgeType = 'live' | 'partial' | 'stale' | 'provisional' | 'out-of-range' | 'error' | 'synthetic';
const BADGE_ICON: Record<BadgeType, IconName> = { live: 'ok', partial: 'partial', stale: 'clock', provisional: 'info', 'out-of-range': 'out-of-range', error: 'error', synthetic: 'synthetic' };

/** Data-status badge: icon + text, never colour alone (1.4.1). */
export function Badge({ type, children }: { type: BadgeType; children: ReactNode }) {
  return (
    <span className={`badge badge--${type}`}>
      <Icon name={BADGE_ICON[type]} size={16} />
      <span>{children}</span>
    </span>
  );
}

/** Chart ⇄ Table toggle (aria-pressed buttons in a labelled group). */
export function ViewToggle({ value, onChange, label }: { value: 'chart' | 'table'; onChange: (v: 'chart' | 'table') => void; label: string }) {
  return (
    <ToggleButtonGroup
      aria-label={label}
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={[value]}
      onSelectionChange={(keys) => { const k = [...keys][0]; if (k === 'chart' || k === 'table') onChange(k); }}
      className="view-toggle"
    >
      <ToggleButton id="chart" className="view-toggle__btn"><Icon name="chart" size={18} /><span>Chart</span></ToggleButton>
      <ToggleButton id="table" className="view-toggle__btn"><Icon name="table" size={18} /><span>Table</span></ToggleButton>
    </ToggleButtonGroup>
  );
}

/** Modal dialog shell: focus trapped, Esc closes, focus restored to trigger (RAC). */
export function AppDialog({ title, children, role = 'dialog', width = 480, ...overlay }: Omit<ModalOverlayProps, 'children'> & { title: string; children: ReactNode | ((close: () => void) => ReactNode); role?: 'dialog' | 'alertdialog'; width?: number }) {
  return (
    <ModalOverlay {...overlay} isDismissable={role === 'dialog'} className="modal-overlay">
      <Modal className="modal" style={{ maxWidth: width }}>
        <Dialog role={role} className="dialog">
          {({ close }) => (
            <>
              <div className="dialog__head">
                <Heading slot="title" level={2} className="dialog__title">{title}</Heading>
                {role === 'dialog' && <IconButton icon="close" label="Close" onPress={close} />}
              </div>
              {typeof children === 'function' ? children(close) : children}
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

/** Visually hidden, always-present live regions (polite + assertive). */
export function LiveRegions() {
  const m = useAnnouncements();
  return (
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true" data-testid="live-polite">{m.polite}</div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true" data-testid="live-assertive">{m.assertive}</div>
    </>
  );
}

/** Visible toast stack. Announcement happens via LiveRegions (see state/toasts). */
export function ToastRegion() {
  const toasts = useToasts();
  return (
    <section className="toast-region" aria-label="Notifications">
      {toasts.map((t) => <ToastItem key={t.id} t={t} />)}
    </section>
  );
}

/** Toasts with an action (e.g. Undo) or errors persist until dismissed; others hide after 8 s, paused while hovered or focused (2.2.1). */
function ToastItem({ t }: { t: ReturnType<typeof useToasts>[number] }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (t.action || t.kind === 'error' || paused) return;
    const h = setTimeout(() => dismissToast(t.id), 8000);
    return () => clearTimeout(h);
  }, [t, paused]);
  return (
    <div className={`toast toast--${t.kind}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <Icon name={t.kind === 'error' ? 'error' : 'ok'} />
      <p className="toast__msg">{t.message}</p>
      {t.action && <Button variant="ghost" onPress={() => { t.action!.onAction(); dismissToast(t.id); }}>{t.action.label}</Button>}
      <IconButton icon="close" label="Dismiss notification" onPress={() => dismissToast(t.id)} />
    </div>
  );
}

export function SkipLink() {
  return <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); const m = document.getElementById('main'); m?.focus(); m?.scrollIntoView(); }}>Skip to main content</a>;
}
