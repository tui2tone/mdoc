'use strict';

import gulp from "gulp";
import markdown from "gulp-markdown-to-json";
import concatJson from "gulp-concat-json";
import jsonTransform from 'gulp-json-transform';
import _ from 'underscore';
import { html2json } from 'html2json';


gulp.task('markdown', () => {
  return gulp.src("./src/markdown/**/*.md")
    .pipe(markdown({
      pedantic: true,
      smartypants: true
    }))
    .pipe(jsonTransform((data, file) => {
      const folders = file.relative.split("/")
      return {
        ...data,
        data: html2json(data.body),
        file: file.relative.replace(".json", ".html"),
        folder: folders.length > 1 ? folders[0] : null ,
        level: folders.length > 1 && folders[1] != "index.json" ? folders[0] : "root"
      };
    }))
    .pipe(concatJson("all.json"))
    .pipe(jsonTransform((data, file) => {
      const menu = getMenu(data)
      return data.map((item) => {
        return {
          ...item,
          menu: menu
        }
      })
    }))
    .pipe(gulp.dest('temp/json'))
});

function getMenu(data) {
  const rootMenu = _.filter(data, (item) => { return item.level == "root" })

  return _.sortBy(rootMenu.map((item) => {
    const subFolders = _.filter(data, (item) => { return item.folder == item.level })
                        .map((sub) => {
                          return {
                            ...sub,
                            index: sub.index,
                            url: "/" + sub.file,
                            title: sub.menu
                          }
                        })

    // const submenu = _.filter(item.data.child, (item) => { return item.tag == "h2" })
    //                   .map((sub) => {
    //                     return {
    //                       url: "/" + item.file + "#" + sub.attr.id,
    //                       title: sub.child[0].text
    //                     }
    //                   })

    return {
      index: item.index,
      title: item.menu,
      url: "/" + item.file,
      submenu: item.level == "root" && item.folder == null ? [] : subFolders
    }
  }), (o) => { return o.index })
}