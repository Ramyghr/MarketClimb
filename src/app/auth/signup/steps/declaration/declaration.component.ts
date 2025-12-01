// declaration.component.ts
import { Component, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import SignaturePad from 'signature_pad';

@Component({
  selector: 'app-declaration',
  templateUrl: './declaration.component.html',
  styleUrls: ['./declaration.component.css']
})
export class DeclarationComponent implements AfterViewInit {

  declarationForm: FormGroup;
  @Output() stepCompleted = new EventEmitter<any>();

  @ViewChild('signaturePad') signaturePadElement!: ElementRef;
  signaturePad!: SignaturePad;

  constructor(private fb: FormBuilder) {
    this.declarationForm = this.fb.group({
      risk_acknowledged: [false, Validators.requiredTrue],
      terms_accepted: [false, Validators.requiredTrue],
      signature: ['', Validators.required] // base64 signature
    });
  }

  ngAfterViewInit(): void {
    this.signaturePad = new SignaturePad(this.signaturePadElement.nativeElement, {
      backgroundColor: 'rgba(255,255,255,0)',
      penColor: 'black',
      minWidth: 1,
      maxWidth: 2
    });
  }

  clearSignature() {
    this.signaturePad.clear();
    this.declarationForm.get('signature')?.setValue('');
  }

  submitStep() {
    if (this.declarationForm.valid) {
      const signatureData = this.signaturePad.isEmpty() ? null : this.signaturePad.toDataURL();
      this.declarationForm.get('signature')?.setValue(signatureData);
      this.stepCompleted.emit(this.declarationForm.value);
    } else {
      this.declarationForm.markAllAsTouched();
    }
  }
}
