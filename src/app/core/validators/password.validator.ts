import { AbstractControl, ValidatorFn } from '@angular/forms';

export const confirmPasswordValidator = (passwordKey = 'password', confirmKey = 'confirm'): ValidatorFn => {
  return (group: AbstractControl) => {
    const password = group.get(passwordKey)?.value;
    const confirm = group.get(confirmKey)?.value;
    return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
  };
};

