import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-personal-details',
  templateUrl: './personal-details.component.html',
  styleUrls: ['./personal-details.component.css']
})
export class PersonalDetailsComponent implements OnInit {

  personalForm: FormGroup;

  @Output() stepCompleted = new EventEmitter<any>(); // emit form data to parent

  // Profile image handling
  profilePreview: string = 'assets/img/faces/ayo-ogunseinde-2.jpg'; // default placeholder
  selectedFile: File | null = null;

  constructor(private fb: FormBuilder) {
    this.personalForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      gender: ['', Validators.required],
      dateOfBirth: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  // Trigger hidden file input
  triggerFileInput() {
    const input = document.getElementById('profileInput') as HTMLInputElement;
    if (input) {
      input.click();
    }
  }

  // Handle file selection and preview
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.profilePreview = reader.result as string; // update preview
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  // Submit this step
  submitStep() {
    if (this.personalForm.valid) {
      const formData = { ...this.personalForm.value, profileImage: this.selectedFile };
      this.stepCompleted.emit(formData); // send data to parent
    } else {
      this.personalForm.markAllAsTouched();
    }
  }
}
