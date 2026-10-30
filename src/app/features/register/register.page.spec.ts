import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../core/environment/environment';
import { RegisterPage } from './register.page';

const user = { id: 1, name: 'John', email: 'john@example.com' };

describe('RegisterPage', () => {
  let fixture: ComponentFixture<RegisterPage>;
  let http: HttpTestingController;
  let router: Router;
  let el: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        providePrimeNG(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterPage);
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

  const name = () => el.querySelector<HTMLInputElement>('#name')!;
  const email = () => el.querySelector<HTMLInputElement>('#email')!;
  const password = () => el.querySelector<HTMLInputElement>('input#password')!;
  const confirm = () => el.querySelector<HTMLInputElement>('input#password_confirmation')!;
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

  it('rejects mismatched passwords without calling the API', () => {
    type(name(), 'John');
    type(email(), 'john@example.com');
    type(password(), 'password123');
    type(confirm(), 'different123');
    submit();

    expect(el.textContent).toContain('Passwords do not match.');
    http.expectNone(`${environment.apiUrl}/register`);
  });

  it('trims name/email, registers (201) and redirects to "/"', () => {
    type(name(), '  John  ');
    type(email(), '  john@example.com  ');
    type(password(), 'password123');
    type(confirm(), 'password123');
    submit();

    const req = http.expectOne(`${environment.apiUrl}/register`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'John',
      email: 'john@example.com',
      password: 'password123',
      password_confirmation: 'password123',
    });
    req.flush({ user, token: '3|abc' }, { status: 201, statusText: 'Created' });
    fixture.detectChanges();

    expect(TestBed.inject(AuthService).isLoggedIn()).toBe(true);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('shows server field errors on 422 and clears them when typing', () => {
    type(name(), 'John');
    type(email(), 'john@example.com');
    type(password(), 'password123');
    type(confirm(), 'password123');
    submit();

    http.expectOne(`${environment.apiUrl}/register`).flush(
      {
        message: 'The email has already been taken.',
        errors: { email: ['The email has already been taken.'] },
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    fixture.detectChanges();

    expect(el.querySelector('#email-error')?.textContent).toContain('The email has already been taken.');
    type(email(), 'john2@example.com');
    expect(el.querySelector('#email-error')).toBeNull();
  });
});
