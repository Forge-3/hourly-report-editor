<template>
  <div id="app">
    <h1>PDF Editor Forge3</h1>

    <h2 class="spacing">1. Wybierz raport w formacie PDF</h2>
    <form @submit.prevent="updateFile">
      <div>
        <input type="file" accept="application/pdf" @change="onFileChange" />
      </div>

      <div v-if="pdfFile">
        <h2 class="spacing">2. Zatwierdź modyfikacje danych</h2>
        <button type="submit">Zatwierdź PDF</button>
      </div>
    </form>
    <div v-if="modifiedPdfUrl">
      <h2 class="spacing">3. Pobierz nowy raport</h2>
      <a
        :href="modifiedPdfUrl"
        :download="newFileName"
      >
        <button>Pobierz zmodyfikowany PDF</button>
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { modifyPdf } from "./utils/pdf";

interface InputFileEvent extends Event {
  target: HTMLInputElement;
}

const rules = [
  {
    pattern: "Forge3",
    replacement: "",
  },
  {
    pattern: "Created with Clockify",
    replacement: "Forge3 - hourly report           ",
  },
];

export default {
  data() {
    return {
      pdfFile: null as null | File,
      modifiedPdfUrl: null as null | string,
    };
  },
  computed: {
    newFileName() {
      if (this.pdfFile) return this.pdfFile.name.replace("Clockify", "Forge3").split(" ")[0];
    },
  },
  methods: {
    onFileChange(event: Event) {
      const inputEvent =  event as InputFileEvent
      if (inputEvent.target.files?.length && inputEvent.target.files?.length > 0)
        this.pdfFile = inputEvent.target.files[0];
    },
    async updateFile() {
      if (!this.pdfFile) {
        alert("Please select a PDF file");
        return;
      }

      const imagePath = "/Forge3_black_300x300.png";
      const response = await fetch(`${window.location.origin}${imagePath}`, {
        method: "GET",
      });
      if (!response.ok) throw new Error("Error reading company logo");
      const blob = await response.blob();

      const modifiedPdfBytes = await modifyPdf(this.pdfFile, blob, rules);
      const modifiedPdfBlob = new Blob([modifiedPdfBytes], {
        type: "application/pdf",
      });
      this.modifiedPdfUrl = URL.createObjectURL(modifiedPdfBlob);
    },
  },
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
}
.spacing {
  margin-top: 48px;
}
</style>
