var logger;
require("./logger/logger_aws_secret.js").then(function (val) {
	logger = val;
	return val;
});
const req_secret = require("./aws/aws_get_secret.js");

const express = require('express');
const app = express();

const port = 80

//Response to the test
app.get('/alive', (req, res) => {
	res.send("alive");
	logger.info("INFO TESTE ALIVE");
	logger.error("ERROR TESTE ALIVE");
});

app.use('/', async (req, res) => {
	//const secret = await req_secret("NOME-SECRET");
	//res.send(`Secret:${secret}`);

	res.send("Hello world");
});

app.listen(port);
console.log(`Running in this port: ${port}`);
