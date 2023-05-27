const { Router } = require('express')
const sessionRouter = Router() 

const passport = require('../middlewares/auth')
const { generateJwtToken } = require('../middlewares/auth')
const { addBlackListJWT } = require('../middlewares/blackList')

const { logger, loggererr } = require('../log/logger')
const { addUserController, getUserController } = require('../controllers/usersController')

const multer = require('multer')
const storage = multer.diskStorage({
  destination: './public/uploads',
  filename: function (req, file, cb) {
    cb( null, req.params.id + '.' + file.originalname.split('.').pop())
  }
})
const upload = multer ({
  storage: storage,
  limits: { fileSize: 1024 * 1024 }
})




/* ------------------ router session ----------------- */
//--------------------- usuario logeado?
sessionRouter.get(
  '/',
  async (req, res) => {
    if (req.session.passport) {
      let userData = await getUserController( req.session.passport.user )
      if (userData) {
        logger.info(`Usuario ${req.session.passport.user} logeado`)
        userData = Object.assign({}, userData._doc, { token: generateJwtToken(req.session.passport.user) })
        res.status(200).send(userData)
      } else {
        logger.warn(`No se ha encontrado el usuario ${req.session.passport.user}`) 
        res.status(401).send(null)
      }
    } else {
      logger.info(`No hay usuario logeado`) 
      res.status(401).send(null)
    }
  }
)


//--------------------- post login user
sessionRouter.post(
  '/login', 
  passport.authenticate('login'),
  async (req, res) => {
    let userData = await getUserController( req.body.username )
    if (userData) {
      logger.info(`Usuario ${req.body.username} logeado`)
      userData = Object.assign({}, userData._doc, { token: generateJwtToken(req.session.passport.user) })
      res.status(200).send(userData)
    } else {
      logger.warn(`No se pudieron recuperar los datos de ${req.body.username} de la base de datos`)
      res.redirect(`info/error/Error al intentar obtener datos de sesion de usuario: ${req.body.username}`)
    }
  }
)


//--------------------- post Register user
sessionRouter.post(
  '/register',
  passport.authenticate('register'),
  ( req, res) => {
    if ( addUserController ({
      username: req.body.username,
      password: req.body.password,
      name: req.body.name,
      address: req.body.address,
      phone: req.body.phone,
      age: req.body.age,
      photo: req.body.photo
    })) {
      logger.info(`Usuario creado correctamente`)
      res.status(200).send({ result: true, msg: 'Usuario creado correctamente'})
    } else {
      logger.info(`No se ha podido crear usuario`)
      res.status(200).send({ result: false, msg: 'No se ha podido crear usuario'})
    }
  }
)

sessionRouter.post(
  '/register/img/:id',
  upload.single('userFileImage'),
  (req, res) => {
    res.status(200)
  }
)


//------------ post cerrar sesion
sessionRouter.post(
  '/logout',
  async (req, res) => {
    addBlackListJWT( req.headers.authorization)
    req.session.destroy((err) => {
      if (err) {
        loggererr.error(`No se ha podido cerrar la sesion, error: ${err}`)
        res.redirect(`info/error/Error al intentar cerrar la session de usuario: ${err}`)
      } else {
        logger.info(`Sesion cerrada.`)
        res.redirect('/')
      }
    })
  }
)


module.exports = sessionRouter