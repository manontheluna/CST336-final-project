"use strict";

function saveLastRecipeSearch(ingredient) {
    localStorage.setItem("lastRecipeSearch", ingredient);
}

document.addEventListener("DOMContentLoaded", loadSavedSearch);

function loadSavedSearch() {
  const savedSearch = localStorage.getItem("lastRecipeSearch");
  const searchInput = document.querySelector("#recipe-search");

  if (savedSearch && searchInput) {
    searchInput.value = savedSearch;
  }
}