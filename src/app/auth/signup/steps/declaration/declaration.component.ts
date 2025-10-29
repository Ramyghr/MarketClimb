import { Component, EventEmitter, OnInit, Output, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import SignaturePad from 'signature_pad';

@Component({
  selector: 'app-declaration',
  templateUrl: './declaration.component.html',
  styleUrls: ['./declaration.component.css']
})
export class DeclarationComponent implements OnInit, AfterViewInit {
  declarationForm: FormGroup;

  @Output() stepCompleted = new EventEmitter<any>();

  @ViewChild('signaturePad') signaturePadElement!: ElementRef;
  signaturePad!: SignaturePad;

  constructor(private fb: FormBuilder) {
    this.declarationForm = this.fb.group({
      riskAcknowledged: [false, Validators.requiredTrue],
      termsAccepted: [false, Validators.requiredTrue],
      signature: ['']
    });
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.signaturePad = new SignaturePad(this.signaturePadElement.nativeElement, {
      backgroundColor: 'rgba(255, 255, 255, 0)',
      penColor: 'black',
      minWidth: 1,
      maxWidth: 2
    });
  }

  clearSignature() {
    this.signaturePad.clear();
  }

  submitStep() {
    if (this.declarationForm.valid) {
      const signatureData = this.signaturePad.isEmpty() ? null : this.signaturePad.toDataURL();
      const stepData = {
        ...this.declarationForm.value,
        signature: signatureData
      };
      this.stepCompleted.emit(stepData);
    } else {
      this.declarationForm.markAllAsTouched();
    }
  }
}
