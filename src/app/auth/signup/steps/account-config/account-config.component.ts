import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-account-config',
  templateUrl: './account-config.component.html',
  styleUrls: ['./account-config.component.css']
})
export class AccountConfigComponent implements OnInit {
  configForm: FormGroup;

  @Output() stepCompleted = new EventEmitter<any>();

  accountTypes = ['Standard', 'ECN', 'Pro'];
currencies = ['USD', 'EUR', 'GBP', 'JPY'];
leverageValues = [10, 50, 100, 200]; // For slider
leverageLabels = ['1:10', '1:50', '1:100', '1:200'];
selectedLeverage = 50; // default
selectedAccountType = 'Standard';
selectedCurrency = 'USD';


  constructor(private fb: FormBuilder) {
    this.configForm = this.fb.group({
      accountType: ['', Validators.required],
      baseCurrency: ['', Validators.required],
      leverage: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  submitStep() {
    if (this.configForm.valid) {
      this.stepCompleted.emit(this.configForm.value);
    } else {
      this.configForm.markAllAsTouched();
    }
  }
  onLeverageChange(event: Event) {
  const input = event.target as HTMLInputElement; // cast properly
  const value = Number(input.value);
  this.selectedLeverage = this.leverageValues[value];
  this.configForm.get('leverage')?.setValue(this.selectedLeverage);
  }

}
