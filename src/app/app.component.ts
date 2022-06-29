import axios from 'axios';
import { Component } from '@angular/core';
import {FormControl, Validators} from '@angular/forms';
import {DomSanitizer} from '@angular/platform-browser';
import {MatIconRegistry} from '@angular/material/icon';

type Word = {
  en: string;
  pl: string;
  audio: string;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'fiszki';

  word: Word = {en: "", pl: "", audio: ""};

  error = false;

  answer = new FormControl('', [Validators.required]);

  constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer) {
    iconRegistry.addSvgIcon('qmark', sanitizer.bypassSecurityTrustResourceUrl('/assets/question-circle-fill.svg'));
    iconRegistry.addSvgIcon('audio', sanitizer.bypassSecurityTrustResourceUrl('/assets/volume-up-fill.svg'));
  }

  async play () {
    console.log("Playing ", this.word.en);

    this.error = true;

    await this.getData2(this.word.en, 0);
 
    const aSound = document.createElement('audio');
    aSound.setAttribute('src', this.word.audio);
    document.getElementsByTagName('body')[0].appendChild(aSound);
    aSound.play();

    setTimeout(() => {document.getElementsByTagName('body')[0].removeChild(aSound)}, 10000);
  }

  async show_answer () {
   this.error = !this.error;

   if (this.error) {
    await this.getData2(this.word.en, 0);
   }
  }

  async check() {
    console.log("You entered: ", this.answer.value);

    if (this.answer.value !== null && this.answer.value !== '' && this.word.en.includes(this.answer.value)) {
      console.log("Correct!!");

      await this.getData2(this.word.en, 1);

      this.word = await this.getData2("", 2);

      this.error = false;
    } else {
      console.log("Bad answer!!");

      this.error = true;

      await this.getData2(this.word.en, 0);
    }

    this.answer.setValue('');
  }

  async ngOnInit() {
    this.word = await this.getData2("", 2);
  }

  async getData(url: string, method: string) {
    try {
      let result;

      if (method === "get") {
        result = await axios.get(
          url,
          {
            headers: {
              Accept: 'application/json',
            },
          },
        );
      } else {
        result = await axios.post(
          url,
          {
            headers: {
              Accept: 'application/json',
            },
          },
        );
      }

      if (result.status !== 200) {
        console.log('Unexpected error: ', result.data);
        return 'An unexpected error occurred';
      }

      return result.data.data.getWord;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log('Error message: ', error.message);
        return error.message;
      } else {
        console.log('Unexpected error: ', error);
        return 'An unexpected error occurred';
      }
    }
  }

  async getData2(word: string, type: number) {
    const url = 'http://localhost:4000/graphql?query=';
    let query = "";

    if (type === 0) {
      query = `mutation%20%7B%0A%20badAnswer(en%3A%20%22${encodeURIComponent(word)}%22)%0A%7D`;
    } else if (type === 1) {
      query = `mutation%20%7B%0A%20goodAnswer(en%3A%20%22${encodeURIComponent(word)}%22)%0A%7D`;
    } else if (type === 2) {
      query = `query%20%7B%0A%20getWord%20%7Ben%2C%20pl%2C%20audio%7D%0A%7D`;
    }

    if (query !== "") {
      if (type === 0 || type === 1) {
        return await this.getData(`${url}${query}`, 'post');
      } else {
        return await this.getData(`${url}${query}`, 'get');
      }
    } else {
      return {en: "", pl: "", audio: ""};
    }
  }
}
