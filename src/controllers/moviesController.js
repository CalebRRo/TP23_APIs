const path = require("path");
const db = require("../database/models");
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const moment = require("moment");

//Aqui tienen otra forma de llamar a cada uno de los modelos
const Movies = db.Movie;
const Genres = db.Genre;
const Actors = db.Actor;

const moviesController = {
  list: async (req, res) => {
   /*  db.Movie.findAll({
      include: ["genre"],
    }).then((movies) => {
      res.render("moviesList.ejs", { movies });
    }); */
    try{
     

        let movies = await db.Movie.findAll({
          orde: ["title"],
            attributes:{
                exclude : ["created_at", "updated_at"]
            }
          })
          if (movies.length) {
            return res.status(200).json({
              ok: true,
              meta: {
                total: movies.length,
              },
              data: movies,
            });
          }
          throw new Error("Upss, hubo un error");

    } catch (error){
        console.log(error);
        return res.status(500).json({
          ok: false,
          msg: error.message
            ? error.message
            : "Comuniquise con el administrador del sitio",
        });
    }
  },
  detail: async (req, res) => {
  /*   db.Movie.findByPk(req.params.id, {
      include: ["genre"],
    }).then((movie) => {
      res.render("moviesDetail.ejs", { movie });
    }); */
    try{
      const {id} = req.params;
      if (isNaN(id)) {
        throw new Error("El Id debe ser un número!!!")
      }
      let movie = await db.Movie.findByPk(id,{
            attributes:{
              exclude: ["created_at", "updated_at"]
            }
      })
      if (movie) {
        return res.status(200).json({
          ok:true,
          meta: {
            total: 1,
          },
          data: movie
        })
      }
      throw new Error("Upss, no se encuentra la peliculas");
    } catch (error){
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: error.message
            ? error.message
            : "Comuniquise con el administrador del sitio",
        })
    }
    
  },
  new: (req, res) => {
    db.Movie.findAll({
      order: [["release_date", "DESC"]],
      limit: 5,
    }).then((movies) => {
      res.render("newestMovies", { movies });
    });
  },
  recomended: (req, res) => {
    db.Movie.findAll({
      include: ["genre"],
      where: {
        rating: { [db.Sequelize.Op.gte]: 8 },
      },
      order: [["rating", "DESC"]],
    }).then((movies) => {
      res.render("recommendedMovies.ejs", { movies });
    });
  },
  //Aqui dispongo las rutas para trabajar con el CRUD
  add: function (req, res) {
    let promGenres = Genres.findAll();
    let promActors = Actors.findAll();

    Promise.all([promGenres, promActors])
      .then(([allGenres, allActors]) => {
        return res.render(path.resolve(__dirname, "..", "views", "moviesAdd"), {
          allGenres,
          allActors,
        });
      })
      .catch((error) => res.send(error));
  },
  create: function (req, res) {
    Movies.create({
      title: req.body.title,
      rating: req.body.rating,
      awards: req.body.awards,
      release_date: req.body.release_date,
      length: req.body.length,
      genre_id: req.body.genre_id,
    })
      .then(() => {
        return res.redirect("/movies");
      })
      .catch((error) => res.send(error));
  },
  edit: function (req, res) {
    let movieId = req.params.id;
    let promMovies = Movies.findByPk(movieId, { include: ["genre", "actors"] });
    let promGenres = Genres.findAll();
    let promActors = Actors.findAll();
    Promise.all([promMovies, promGenres, promActors])
      .then(([Movie, allGenres, allActors]) => {
        Movie.release_date = moment(Movie.release_date).format("L");
        return res.render(
          path.resolve(__dirname, "..", "views", "moviesEdit"),
          { Movie, allGenres, allActors }
        );
      })
      .catch((error) => res.send(error));
  },
  update: function (req, res) {
    let movieId = req.params.id;
    Movies.update(
      {
        title: req.body.title,
        rating: req.body.rating,
        awards: req.body.awards,
        release_date: req.body.release_date,
        length: req.body.length,
        genre_id: req.body.genre_id,
      },
      {
        where: { id: movieId },
      }
    )
      .then(() => {
        return res.redirect("/movies");
      })
      .catch((error) => res.send(error));
  },
  delete: function (req, res) {
    let movieId = req.params.id;
    Movies.findByPk(movieId)
      .then((Movie) => {
        return res.render(
          path.resolve(__dirname, "..", "views", "moviesDelete"),
          { Movie }
        );
      })
      .catch((error) => res.send(error));
  },
  destroy: function (req, res) {
    let movieId = req.params.id;
    Movies.destroy({ where: { id: movieId }, force: true }) // force: true es para asegurar que se ejecute la acción
      .then(() => {
        return res.redirect("/movies");
      })
      .catch((error) => res.send(error));
  },
};

module.exports = moviesController;
