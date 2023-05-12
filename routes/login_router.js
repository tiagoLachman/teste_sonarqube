const mysql = require('mysql2');
const express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const router = express.Router();
require('dotenv').config();

function conectar() {
    return new Promise((resolve, rejects) => {

        let connection = mysql.createConnection({
            host: process.env.host,
            user: process.env.user,
            password: process.env.password,
            database: process.env.database
        });

        connection.connect(err => {
            if (err) {
                rejects(err);
            } else {
                resolve(connection)
            }
        });
    })
}

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.get('/', function (req, res) {
    if (req.session.loggedin) {
        res.redirect("/tela_inicial");
    } else {
        res.sendFile(path.join(__dirname + '/html/tela_login.html'));
    }
});

router.post("/updateLogin", async (req, res) => {
    let jSend = {
        "bEmailErrado": true,
        "bSenhaErrado": true,
        "cMensagemErro": null,
        "redirect": null,
    };

    let cEmail = req.body["Email"];
    let cSenha = req.body["Senha"];
    let connection;

    console.log(`req.body${JSON.stringify(req.body)}`);

    console.log(`Email:${cEmail}\nSenha:${cSenha}\n--------------`);

    if (cEmail == "") {
        //console.log("Erro email");
        jSend.bSenhaErrado = false;
        jSend.cMensagemErro = "Insira seu Email";
        res.send(jSend);
        return;
    } else if (cSenha == "") {
        //console.log("Erro senha");
        jSend.bEmailErrado = false;
        jSend.cMensagemErro = "Insira sua Senha";
        res.send(jSend);
        return;
    }

    try {
        connection = await conectar();
    } catch (err) {
        if (err) {
            if (err.code == "ECONNREFUSED") {
                console.log("Servidor OFFLINE");
                jSend.cMensagemErro = err.code;
                res.send(jSend);
                return;
            } else {
                throw err;
            }
        }
    }
    try {
        connection.query('SELECT * FROM registered_users WHERE email = ?', [cEmail], (err, results, fields) => {
            if (err) {
                throw err;
            }
            //console.log(results);
            if (results.length == 1) {
                //console.log("Email encontrado");
                jSend.bEmailErrado = false;
                req.session.email = cEmail;
                jSend.bSenhaErrado = !(cSenha == results[0]["password"]);

                if (jSend.bSenhaErrado) {
                    //console.log("Senha incorreta");
                    jSend.cMensagemErro = "Senha incorreta";
                }
                else {
                    //console.log("Senha correta");
                }


            } else if (results.length > 1) {
                //console.log("Mais de uma conta encontrada com esse email:"+cEmail);

                jSend.bEmailErrado = true;
                jSend.bSenhaErrado = true;
                jSend.cMensagemErro = "Mais de uma conta encontrada com esse email";

            } else {
                //console.log("Email não encontrado");
                jSend.cMensagemErro = "Email não encontrado";
                jSend.bEmailErrado = true;
                jSend.bSenhaErrado = false;
            }
            //console.log("--------");

            if (jSend.bEmailErrado == false && jSend.bSenhaErrado == false && jSend.cMensagemErro == null) {
                req.session.loggedin = true;
                jSend.redirect = "tela_inicial";
                res.send(jSend)
            } else {
                res.send(jSend);
            }
        });
    } catch (err) {
        throw err;
    } finally {
        connection.end();
    }
});

module.exports = router;
