import { getFavoriteStories } from "../../utils/profile";
import { generateStoryItemTemplate } from "../../template";

export default class FavoritePage {
  async render() {
    return `
      <section class="container">
        <div class="favorite-container">
          <h1 class="section-title">Favorite Stories</h1>
          <div id="favorite-stories-container" class="favorite-content">
            <!-- Stories will be loaded here -->
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.loadFavoriteStories();
  }

  loadFavoriteStories() {
    const favoriteStories = getFavoriteStories();
    const container = document.getElementById("favorite-stories-container");

    if (!favoriteStories || favoriteStories.length === 0) {
      container.innerHTML = `
        <div class="favorite-message">
          <h2>No Favorite Stories</h2>
          <p>You haven't favorited any stories yet. Browse stories and click the favorite button to save them for later.</p>
          <a href="#/home" class="btn">Browse Stories</a>
        </div>
      `;
      return;
    }

    const html = favoriteStories.reduce((accumulator, story) => {
      return accumulator.concat(
        generateStoryItemTemplate({
          ...story,
          name: story.name,
        })
      );
    }, "");

    container.innerHTML = `
      <div class="stories-list">${html}</div>
    `;
  }
}
