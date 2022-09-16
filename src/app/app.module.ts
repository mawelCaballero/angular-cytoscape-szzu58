//Library components
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { FormsModule } from '@angular/forms';
import { DragAndDropModule } from 'angular-draggable-droppable'

//Main component
import { AppComponent } from './app.component';

//Other components
import { EditorComponent } from './editor/editor.component';




@NgModule({
  imports:      [ BrowserModule, FormsModule, DragAndDropModule ],
  declarations: [ AppComponent, EditorComponent],
  providers:    [ ],
  bootstrap:    [ AppComponent ]
})

export class AppModule { }
