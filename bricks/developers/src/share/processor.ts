import {
  Story,
  Chapter,
  I18nString,
  CategoryGroup,
  StoryDoc,
  MenuIcon,
} from "@next-core/brick-types";
import { cloneDeep } from "lodash";
import { atomBook } from "../stories/chapters/atom-bricks";
import { businessBook } from "../stories/chapters/business-bricks";
import i18next from "i18next";
import { K, NS_DEVELOPERS } from "../i18n/constants";

export interface BrickRecord {
  id: string;
  type: "brick" | "template";
  title: string;
  subTitle?: string;
  description: string;
  category?: string;
  icon?: MenuIcon;
  tags?: string[];
  doc?: string | StoryDoc;
}

export const DEFAULT_DESCRIPTION = "~";

export function searchByQ(q: string, matchStringList: string[]): boolean {
  if (!q) {
    return true;
  }
  const qList = q
    .toLowerCase()
    .split(" ")
    .map((i) => i.trim());
  const macthStringGroup = matchStringList.join(" ").toLowerCase();
  return !qList.find((i) => !macthStringGroup.includes(i));
}

export function searchByCategory(
  categories: string | string[],
  currCategory: string
): boolean {
  if (!categories || categories.length == 0) {
    return true;
  }
  if (Array.isArray(categories)) {
    return categories.includes(currCategory);
  } else {
    return categories === currCategory;
  }
}

export const getStoryTitle = (story: Story, lang: keyof I18nString) => {
  return story?.deprecated
    ? `（${i18next.t(K.DEPRECATED, { ns: NS_DEVELOPERS })}）${story.text[lang]}`
    : story.text[lang];
};

export const getAllStoryListV2 = (
  categoryGroups: CategoryGroup[],
  stories: Story[],
  q?: string,
  categories?: string | string[],
  fields?: Record<string, boolean>
): BrickRecord[] => {
  const storyList: BrickRecord[] = [];
  let books: Chapter[] = [];
  fields = fields || {};
  const externalBook: Chapter[] = [];
  const groups = cloneDeep(categoryGroups);
  groups.forEach((menu) => {
    if (menu.group === "atom") {
      menu.items.forEach((item) => {
        if (!atomBook.some((book) => book.category === item.category)) {
          atomBook.push({ ...item, stories: [] });
        }
      });

      return;
    }

    if (menu.group === "business") {
      menu.items.forEach((item) => {
        // atomBook.
        if (!businessBook.some((book) => book.category === item.category)) {
          businessBook.push({ ...item, stories: [] });
        }
      });

      return;
    }

    externalBook.push(...menu.items);
  });
  books = [...atomBook, ...businessBook, ...externalBook];
  const lang = i18next.language
    ? (i18next.language.split("-")[0] as keyof I18nString)
    : "zh";
  stories.forEach((story) => {
    const finder = books.find((book) => book.category === story.category);
    if (finder) {
      const index = finder.stories.findIndex(
        (v) => v.storyId === story.storyId
      );
      if (index === -1) {
        finder.stories.push(story);
      } else {
        finder.stories[index] = story;
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn(
        "Cannot match category  `%s` of `%s`  with any existed category. %o",
        story.category,
        story.storyId,
        story
      );
    }
  });
  books.forEach((chapter) => {
    chapter.stories.forEach((story) => {
      if (story.deprecated) {
        return;
      }
      const description = story.description
        ? story.description[lang] || DEFAULT_DESCRIPTION
        : DEFAULT_DESCRIPTION;
      const title = story.text[lang];
      const category = chapter.category;
      const author = story.author || "";
      if (
        searchByQ(q, [description, title, author, story.storyId]) &&
        searchByCategory(categories, category)
      ) {
        const tags = [chapter.title];
        if (story.tags) {
          tags.push(...story.tags);
        }
        const item: BrickRecord = {
          id: story.storyId,
          type: story.type,
          title: getStoryTitle(story, lang),
          subTitle: story.author,
          description: description,
          tags: tags.map((item) => item[lang]),
          icon: story.icon,
          category: category,
        };
        if (fields.doc) {
          item.doc = story.doc;
        }
        storyList.push(item);
      }
    });
  });
  return storyList;
};
