// personal-details.component.ts
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-personal-details',
  templateUrl: './personal-details.component.html',
  styleUrls: ['./personal-details.component.css']
})
export class PersonalDetailsComponent implements OnInit {

  personalForm: FormGroup;
  @Output() stepCompleted = new EventEmitter<any>();

  profilePreview: string = 'assets/img/faces/ayo-ogunseinde-2.jpg';
  selectedFile: File | null = null;

  constructor(private fb: FormBuilder) {
    this.personalForm = this.fb.group({
      first_name: ['', Validators.required],       // renamed
      last_name: ['', Validators.required],        // renamed
      email: ['', [Validators.required, Validators.email]],
      gender: [''],                                // extra, optional
      date_of_birth: [''],                         // extra, optional
      avatar_url: ['']                             // maps profileImage
    });
  }

  ngOnInit(): void {}

  triggerFileInput() {
    const input = document.getElementById('profileInput') as HTMLInputElement;
    if (input) input.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.profilePreview = reader.result as string;
      reader.readAsDataURL(this.selectedFile);
      this.personalForm.patchValue({ avatar_url: this.selectedFile });
    }
  }

  submitStep() {
    if (this.personalForm.valid) {
      this.stepCompleted.emit(this.personalForm.value);
    } else {
      this.personalForm.markAllAsTouched();
    }
  }
}
