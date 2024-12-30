
# README

Welcome to the content management guide for the Psychometrics and Data Science Laboratory website. This document will help you understand how to modify the contents of different pages, as well as how to add, modify, or delete profiles and projects.

**Note**: All content should be written in Markdown syntax. For a comprehensive guide on Markdown syntax, please refer to [Markdown Guide](https://www.markdownguide.org/).

## Table of Contents

- [Home Page (`index.md`)](#home-page-indexmd)
  - [Modifications](#modifications)
- [About Page (`about.md`)](#about-page-aboutmd)
  - [Modifications](#modifications-1)
- [People Page (`people.md`)](#people-page-peoplemd)
  - [Modifications](#modifications-2)
  - [Managing Profiles](#managing-profiles)
    - [Adding Profiles](#adding-profiles)
    - [Modifying Profiles](#modifying-profiles)
    - [Deleting Profiles](#deleting-profiles)
- [Projects Page (`projects.md`)](#projects-page-projectsmd)
  - [Modifications](#modifications-3)
  - [Managing Projects](#managing-projects)
    - [Adding Projects](#adding-projects)
    - [Modifying Projects](#modifying-projects)
    - [Deleting Projects](#deleting-projects)
- [Publications Page (`publications.md`)](#publications-page-publicationsmd)
  - [Modifications](#modifications-4)
- [Courses Page (`courses.md`)](#courses-page-coursesmd)
  - [Modifications](#modifications-5)
- [Resources Page (`resources.md`)](#resources-page-resourcesmd)
  - [Modifications](#modifications-6)

## Home Page (`index.md`)

```markdown
---
layout: article
title: "Psychometrics<br>&nbsp;&nbsp;&nbsp;&nbsp;and<br>Data Science<br>Laboratory"
mode: immersive
header:
  theme: dark
article_header:
  type: overlay
  theme: dark
  background_color: '#123'
  background_image:
    src: /assets/bg.webp
excerpt: "directed by Professor J. Chen"
---

<script>
  document.title = "Psychometrics and Data Science Laboratory";
</script>
```

### Modifications
- `title`: Change the title of the page. Note that HTML tags can be used for formatting.
- `background_image`: Update the path to the background image as needed.
- `excerpt`: Modify the short tagline that appears on the home page.
- **Document Title**: The `<script>` section sets the document's title in the browser. Adjust this as necessary.

## About Page (`about.md`)

```markdown
---
layout: article
title: About
---
```

### Modifications
- **Content**: Update the welcome message, mission statement, and focus areas as necessary.

## People Page (`people.md`)

```markdown
---
layout: articles
title: People
articles:
  data_source: site.people
  show_excerpt: true
  show_cover: true
  show_readmore: true
  excerpt_type: html
  show_info: false
  custom_order: [ "jinsong-chen" ]
---
```

### Modifications
- `show_excerpt`: Show or hide excerpts.
- `show_cover`: Show or hide cover images.
- `custom_order`: Specify the order of articles by listing the slugs.

### Managing Profiles
1. **Adding Profiles**: Create a new markdown file in the `_people` directory with the necessary front matter and content. Example:
  ```markdown
  ---
  title: Professor Chen, Jinsong
  slug: jinsong-chen
  tags: People
  cover: /assets/people/jinsong-chen.jpg
  ---
  ```

- `slug`: The `slug` is a URL-friendly version of the person's name. It should be unique for each person and is used as an identifier for ordering people on the People page. Make sure the `slug` matches the identifier used in the `custom_order` list in `people.md`.


- `cover`: Specify the path to the person's profile image stored in `/assets/people/`. This image will be displayed on the People page.

- **Content Preview**: Content before the `<!--more-->` tag in the markdown file will be shown as a preview on the People page. Ensure that the most important information is placed before this tag to provide a concise summary.

2. **Modifying Profiles**: Edit the markdown file of the person you want to modify in the `_people` directory.
3. **Deleting Profiles**: Remove the markdown file of the person from the `_people` directory.

## Projects Page (`projects.md`)

```markdown
---
layout: articles
title: Projects
articles:
  data_source: site.projects
  show_excerpt: true
  show_cover: false
  show_readmore: true
  excerpt_type: html
  show_info: true
  reverse: true
---
```

### Modifications
- `show_excerpt`: Show or hide excerpts.
- `show_cover`: Show or hide cover images.
- `show_info`: Show or hide date.
- `reverse`: Display projects in reverse chronological order if set to true.

### Managing Projects
1. **Adding Projects**: Create a new markdown file in the `_projects` directory with the necessary front matter and content. Example:
  ```markdown
  ---
  title: "Advancing Generative AI in Personalized Learning"
  tags: Projects
  show_tags: false
  ---
  ```

- **Filename Format**: The filename for each project must follow the format `YYYY-MM-DD-Title-With-Hyphens.md`. The date should be in `YYYY-MM-DD` format, and the title should have spaces replaced with hyphens. Example: `2024-04-01-Advancing-Generative-AI-in-Personalized-Learning.md`.

2. **Modifying Projects**: Edit the markdown file of the project you want to modify in the `_projects` directory.
3. **Deleting Projects**: Remove the markdown file of the project from the `_projects` directory.

## Publications Page (`publications.md`)

```markdown
---
layout: article
title: Publications
---
```

### Modifications
- **Content**: Update the list of publications as necessary.

## Courses Page (`courses.md`)

```markdown
---
layout: article
title: Courses
aside:
  toc: true
---
```

### Modifications
- `toc`: The `toc` option in the `aside` section enables the table of contents. Set this to `false` if you do not want a TOC on this page.
- **Content**: Update the list of courses, including course codes, titles, and instructors. Ensure the list is organized by year and semester.

## Resources Page (`resources.md`)

```markdown
---
layout: article
title: Resources
key: page-resources
---
```

### Modifications
- **Content**: Update the list of resources, including titles, links, authors, and descriptions. Add or remove resources as necessary.

---
