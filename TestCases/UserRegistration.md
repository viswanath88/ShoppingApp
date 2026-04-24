# User Registration - Test Scenarios

## Happy Path
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| HP-01 | Successful registration | User is on `/register` page | Fill valid name, email, password (6+ chars), confirm password and click "Create Account" | Redirect to `/login` with "Account created successfully" message | P0 |
| HP-02 | Navigate to login from register | User is on `/register` | Click "Login here" link | Navigate to `/login` page | P2 |

## Business Rules
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| BR-01 | Name minimum length | User is on `/register` | Enter name with 1 character | Validation error "Name must be at least 2 characters" | P1 |
| BR-02 | Password minimum length | User is on `/register` | Enter password with 5 characters | Validation error "Password must be at least 6 characters" | P1 |
| BR-03 | Password strength indicator | User is on `/register` | Type password of varying lengths | Weak (<6), Good (6-9), Strong (10+) indicator shown | P2 |
| BR-04 | Passwords match confirmation | User is on `/register` | Enter matching password and confirm password | Green "Passwords match" indicator shown | P2 |
| BR-05 | Registration does not auto-login | User completes registration | Form submitted successfully | User is redirected to `/login` (NOT auto-logged in), must login manually | P1 |

## Security
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| SEC-01 | Duplicate email rejection | User "jane@example.com" already exists | Register with same email | Error "Email already registered" (409) | P0 |
| SEC-02 | Password not returned in response | User registers successfully | Check API response body | Response contains user object WITHOUT password field | P1 |
| SEC-03 | SQL injection in email field | User is on `/register` | Enter `'; DROP TABLE User;--` as email | Validation error for invalid email format, no DB damage | P1 |
| SEC-04 | XSS in name field | User is on `/register` | Enter `<script>alert('xss')</script>` as name | Name stored/displayed as plain text, no script execution | P1 |
| SEC-05 | Guest-only route guard | User is already logged in | Navigate to `/register` | Redirect to `/` (home page) | P1 |

## Negative/Error
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| NEG-01 | Empty form submission | User is on `/register` | Click "Create Account" without filling any fields | Validation error "Name is required" shown | P0 |
| NEG-02 | Invalid email format | User is on `/register` | Enter "not-an-email" in email field | Validation error "Please enter a valid email address" | P1 |
| NEG-03 | Passwords don't match | User is on `/register` | Enter different password and confirm password | Validation error "Passwords do not match" | P0 |
| NEG-04 | Missing confirm password | User fills name, email, password | Leave confirm password empty and submit | Validation error "Please confirm your password" | P1 |
| NEG-05 | Server error during registration | Backend is down | Submit valid registration form | Error toast displayed, user stays on register page | P1 |

## Edge Cases
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| EC-01 | Very long name (100 chars) | User is on `/register` | Enter name at max length boundary | Registration succeeds | P2 |
| EC-02 | Email with special characters | User is on `/register` | Enter `user+tag@example.com` | Registration succeeds | P2 |
| EC-03 | Double submit prevention | User is on `/register` | Click "Create Account" rapidly twice | Only one request sent (button shows loading/disabled state) | P1 |
| EC-04 | Password exactly 6 characters | User is on `/register` | Enter password with exactly 6 characters | Registration succeeds (boundary met) | P2 |

## UI State
| # | Scenario | Given | When | Then | Priority |
|---|----------|-------|------|------|----------|
| UI-01 | Loading state during submission | User submits valid registration | Form is processing | Button shows spinner + "Creating account..." text, inputs remain | P1 |
| UI-02 | Validation errors clear on edit | Validation errors are displayed | User starts editing the errored field | Error message for that field disappears | P2 |
| UI-03 | Server error banner | Backend returns an error | Registration fails | Red error banner shown at top of form | P1 |
| UI-04 | Mobile responsive layout | User is on mobile viewport | View register page | Form fills full width, all fields stacked vertically | P2 |

---

## Summary

| Lens | Count |
|------|-------|
| Happy Path | 2 |
| Business Rules | 5 |
| Security | 5 |
| Negative/Error | 5 |
| Edge Cases | 4 |
| UI State | 4 |
| **Total** | **25** |
