import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { Buffer } from "buffer";

// Set global
window.Buffer = Buffer;

createApp(App).mount('#app')
