import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import { environment } from '../../core/environment/environment';
import { AuthService } from '../../core/auth/auth.service';
import { LoginPage } from './login.page';

const user = { id: 1, name: 'John', email: 'john@example.com' };

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let http: HttpTestingController;
  let router: Router;
  let el: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        providePrimeNG(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  const email = () => el.querySelector<HTMLInputElement>('#email')!;
  const password = () => el.querySelector<HTMLInputElement>('input#password')!;
  const form = () => el.querySelector<HTMLFormElement>('form')!;

  function type(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submit(): void {
    form().dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  it('shows the title, subtitle and fields', () => {
    expect(el.textContent).toContain('Welcome back');
    expect(el.textContent).toContain('Log in to consult a doctor.');
    expect(email().type).toBe('email');
    expect(el.querySelector('label[for="email"]')).toBeTruthy();
    expect(el.querySelector('label[for="password"]')).toBeTruthy();
  });

  it('shows required errors and does not call the API when empty', () => {
    submit();
    expect(el.textContent).toContain('Email is required.');
    expect(el.textContent).toContain('Password is required.');
    http.expectNone(`${environment.apiUrl}/login`);
  });

  it('shows an error for an invalid email', () => {
    type(email(), 'not-an-email');
    email().dispatchEvent(new Event('blur'));
    type(password(), 'secret');
    submit();
    expect(el.textContent).toContain('Please enter a valid email address.');
    http.expectNone(`${environment.apiUrl}/login`);
  });

  it('logs in and goes to "/" on success', () => {
    type(email(), 'john@example.com');
    type(password(), 'password');
    submit();

    const req = http.expectOne(`${environment.apiUrl}/login`);
    expect(req.request.body).toEqual({ email: 'john@example.com', password: 'password' });
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ user, token: '3|abc' });
    fixture.detectChanges();

    expect(TestBed.inject(AuthService).isLoggedIn()).toBe(true);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('goes to the return URL after login', () => {
    fixture.componentRef.setInput('returnUrl', '/somewhere');
    fixture.detectChanges();
    type(email(), 'john@example.com');
    type(password(), 'password');
    submit();
    http.expectOne(`${environment.apiUrl}/login`).flush({ user, token: 't' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/somewhere');
  });

  it('ignores a return URL that points to another site', () => {
    fixture.componentRef.setInput('returnUrl', '//evil.com');
    fixture.detectChanges();
    type(email(), 'john@example.com');
    type(password(), 'password');
    submit();
    http.expectOne(`${environment.apiUrl}/login`).flush({ user, token: 't' });
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('shows the API message, keeps the email and clears the password on wrong credentials', async () => {
    type(email(), 'john@example.com');
    type(password(), 'wrong');
    submit();
    http
      .expectOne(`${environment.apiUrl}/login`)
      .flush({ message: 'The provided credentials are incorrect.' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(el.querySelector('p-message')?.textContent).toContain('The provided credentials are incorrect.');
    expect(email().value).toBe('john@example.com');
    expect(password().value).toBe('');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(TestBed.inject(AuthService).isLoggedIn()).toBe(false);
  });
});
