// further-info.component.ts
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-further-info',
  templateUrl: './further-info.component.html',
  styleUrls: ['./further-info.component.css']
})
export class FurtherInfoComponent implements OnInit {
  furtherForm: FormGroup;
  @Output() stepCompleted = new EventEmitter<any>();

  idPreview: string = 'assets/img/id_exemple.jpg';
  selectedIDFile: File | null = null;

  constructor(private fb: FormBuilder) {
    this.furtherForm = this.fb.group({
      address: [''],          // extra
      phone: [''],            // extra
      country: [''],          // extra
      id_document: ['']       // maps selectedIDFile
    });
  }

  ngOnInit(): void {}

  onIDSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      this.selectedIDFile = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => this.idPreview = e.target.result;
      reader.readAsDataURL(this.selectedIDFile!);
      this.furtherForm.patchValue({ id_document: this.selectedIDFile });
    }
  }

  submitStep() {
    this.stepCompleted.emit(this.furtherForm.value);
  }
}
