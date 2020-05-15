// Данный файл описывает действия которые необходимо применить к файлам в проекте.
// В данном файле описывается Автоматизация
"use strict";
// Переменная gulp
var gulp = require("gulp");
var plumber = require("gulp-plumber");
var sourcemap = require("gulp-sourcemaps");
var less = require("gulp-less");
var postcss = require("gulp-postcss");
var autoprefixer = require("autoprefixer");
var server = require("browser-sync").create();
var csso = require("gulp-csso");
var rename = require("gulp-rename");
var imagemin = require("gulp-imagemin");
var webp = require("gulp-webp");
var svgstore = require("gulp-svgstore");
var posthtml = require("gulp-posthtml");
var include = require("posthtml-include");
var del = require("del");
//
// Задача которую запустит npm run build из packaje.json
gulp.task("css", function() {
  //Верни найдя значения из содержимого файла находящегося в папке...
  return gulp.src("source/less/style.less")
  // Функция pipe - "труба" вбирает в себя значения от предыдущей задачи и (если есть последующая) передает в себе или последующей функции для обработки в соответствии с заложенным в них функционалом.
  //.pipe(plumber())-обработчик проверяющий препроцессорные файлы и информирующий о возникновении проблем но посредством него не ломается сборка.
    .pipe(plumber())
    // Карта кода, эта команда получает исходное состояние.
    .pipe(sourcemap.init())
    // Запуск библиотеки-механизма библиотеки gulp-less из библиотеки npm. Установлена в секцию разработчика devDependencies файла packaje.json.
    // less() - Собирает less файлы в единый css файл.
    .pipe(less())
    // .pipe(postcss([- Библиотека-механизм со своими внутренними библиотеками.
    .pipe(postcss([
      // Автопрефиксер. - Составная часть библиотеки postcss. Ставит префиксы. Обрабатывает полученный css и добавляет необходимые префиксы.
      autoprefixer()
    ]))
    // МИНИФИКАЦИЯ файла css
    .pipe(csso())
    // Изменение имени файла на указанный.
    .pipe(rename("style.min.css"))
    // Карта кода, получает обработанное состояние. Сравнивает с исходным состоянием.
    .pipe(sourcemap.write("."))
    // dest помести данные файлы в следующую папку по такому адресу.
    .pipe(gulp.dest("build/css"))
    .pipe(server.stream());
});
//
// Создает сервер с содержимым нашего проекта.
gulp.task("server", function() {
  //Сервер, инициализуруй со следующими настройками
  server.init({
    //Адрес нахождения файлов для создания сервера.
    server: "build/",
    // notify: false,
    // open: true,
    // cors: true,
    // ui: false
  });
  // Указание файлов для наблюдения-контроля состояния.
  // Найди в указанной папке и всех подпапках файлы с сширением .less и как только в них произойдет изменение выполни следующую задачу - series("css").
  gulp.watch("source/less/**/*.less", gulp.series("css"));
  // Следи за измениниями в папке и как только они изменятся - перезагрузи сервер.
  gulp.watch("source/img/icon-*.svg", gulp.series("sprite", "html", "refresh"));
  gulp.watch("source/*.html", gulp.series("html", "refresh"));
});

gulp.task("refresh", function(done) {
  server.reload();
  done();
})
// Оптимизация изображения
gulp.task("images", function(){
  //на любой вложенности найти такие файлы.
  return gulp.src("source/img/**/*.{png,jpg,svg}")
  //Запускаем библиотеку оптимизации изображений.
  .pipe(imagemin([
    // Это свойство значит - сколько раз optipng осуществит прогонов оптимизации - проверить уровень, время оптимизации и принять оптимальное решение можно с помощью полученного вместе с установкой node.js пакета npx(Дает возможность использовать пакеты без их установки.) посредством команды npx gulp images.
    imagemin.optipng({optimizationLevel: 3}),
    // оптимизация jpеg. Это свойство постепенно-при загрузке-улучшает качество загружаемых изображений jpeg.
    imagemin.jpegtran({progressive: true}),
    // отпимизация svg.
    imagemin.svgo()
  ]))

  .pipe(gulp.dest("source/img"))
})

gulp.task ("webp", function() {
  return gulp.src("source/img/**/*.{png,jpg}")
  // выполнить задачу преобразования в webp с получением 90% качества изображений.
  .pipe(webp({quality: 90}));
})
// Создание спрайта с СВГ. Запускается командой npx gulp sprite, полученный спрайт мы вставляем в разметку?
gulp.task("sprite", function() {
  // Искать все иконки
  return gulp.src("source/img/icon-*.svg")
  //
  .pipe(svgstore({
    // Удалит все комментарии в инлайновом СВГ ??
    inlineSvg: true
  }))
  .pipe(rename("sprite.svg"))
  .pipe(gulp.dest("build/img"));
})
// ----------?--------------
// Задача для HTML: Взять файл и добавить в указанное место в разметке. Для выполнения этой задачи необходим плагин posthtml-include. Этот плагин добавит новый тег в HTML, тег - include.В разметке Нужно обернуть спрайт в тег <div style="display: none"><include src="build/img/sprite.svg"></include></div>
// После необходимо запустить сборку спрайта и его вставку в html командой - npx gulp sprite && npx gulp html
gulp.task("html", function() {
  return gulp.src("source/*.html")
  .pipe(posthtml([
    // Добавляю плагин include для добавления одноименного тега.
    include()
  ]))
  .pipe(gulp.dest("build"));
})
//Задача для запуска npm run build
gulp.task("build", gulp.series(
// Очищаем папку
  "clean",
  // Копируем не обработанные файлы которые требуются
  "copy",
  // Вставляем файлы после обработке через перечень задач в CSS задаче.
  "css",
  // Добавляем спрайт из свг для последующей встройке через htmlpost
  "sprite",
  // Встраиваем html-include в html на месте тегов include и тем самым заменяем его на всех страницах где он указан.
  "html"
  ));
//Задача для запуска npm run start
gulp.task("start", gulp.series(
  "build",
  "server"
  ));
// Задача копирования-по сути переноса
gulp.task("copy", function() {
  return gulp.src([
    "source/fonts/**/*.{woff, woff2}",
    "source/img/**",
    "source/js/**",
    "source/*.ico"
    ], {
      // Сохраняет структуру проекта
      base: "source"
    })
    .pipe(gulp.dest("build"));
});

gulp.task("clean", function() {
  return del("build");
});

// gulp.task("clean", function (done) {
//   del(path.clean.build);
//   done();
// });

