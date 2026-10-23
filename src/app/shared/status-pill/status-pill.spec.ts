import { TestBed } from '@angular/core/testing';
import { ConsultationStatus } from '../../core/models';
import { StatusPill, STATUS_STYLES } from './status-pill';

describe('StatusPill', () => {
  function render(status: ConsultationStatus): HTMLElement {
    const fixture = TestBed.createComponent(StatusPill);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows Scheduled with the custom purple class', () => {
    const el = render('scheduled');
    expect(el.textContent).toContain('Scheduled');
    expect(el.querySelector('.status-pill--scheduled')).toBeTruthy();
    expect(STATUS_STYLES.scheduled.severity).toBeUndefined();
  });

  it('shows Completed as success (green)', () => {
    const el = render('completed');
    expect(el.textContent).toContain('Completed');
    expect(el.querySelector('.p-tag-success')).toBeTruthy();
  });

  it('shows Cancelled as secondary (grey)', () => {
    const el = render('cancelled');
    expect(el.textContent).toContain('Cancelled');
    expect(el.querySelector('.p-tag-secondary')).toBeTruthy();
  });
});
