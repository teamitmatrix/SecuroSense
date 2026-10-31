// src/app/pipes/translate.pipe.ts
import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../services/translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Make it impure to detect language changes
})
export class TranslatePipe implements PipeTransform {
  private translationService = inject(TranslationService);

  transform(key: string, params?: { [key: string]: any }): string {
    if (!key) return '';

    // Access the signal to make the pipe reactive to language changes
    this.translationService.currentLanguage();

    return this.translationService.translate(key, params);
  }
}

