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

  countries: string[] = [
    'United States','United Kingdom','Canada','France','Germany','Spain','Italy','Australia','Japan','China',
    'India','Brazil','Mexico','Russia','Tunisia','South Africa','Other' // add all as needed
  ];

  addressMap: string | null = null; // Map image URL

  constructor(private fb: FormBuilder) {
    this.furtherForm = this.fb.group({
      address: ['', Validators.required],
      phone: ['', Validators.required],
      country: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  onIDSelected(event: any) {
    if (event.target.files && event.target.files[0]) {
      const file: File = event.target.files[0];
      this.selectedIDFile = file;

      const reader = new FileReader();
      reader.onload = (e: any) => this.idPreview = e.target.result;
      reader.readAsDataURL(file);
    }
  }

  // Update map preview dynamically using Google Maps Static API
  updateMap() {
    const address = this.furtherForm.get('address')?.value;
    if (address && address.length > 3) {
      this.addressMap = `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(address)}&zoom=15&size=400x200&markers=color:red|${encodeURIComponent(address)}&key=YOUR_API_KEY`;
    } else {
      this.addressMap = null;
    }
  }

  submitStep() {
    if (this.furtherForm.valid) {
      const stepData = { ...this.furtherForm.value, idDocument: this.selectedIDFile };
      this.stepCompleted.emit(stepData);
    } else {
      this.furtherForm.markAllAsTouched();
    }
  }
}
