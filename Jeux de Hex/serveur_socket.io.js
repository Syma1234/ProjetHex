const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require("socket.io")(server);

server.listen(8888, () => {
    console.log('Le serveur écoute sur le port 8888');
});

app.use(express.static(__dirname));

app.get('/', (request, response) => {
    response.sendFile('client_socket.io.html', { root: __dirname });
});


let nomsJoueurs = [];
let nbJoueurs = 0;
let tour = 0;
let nbrTour = 0;
let etatDamier = [];
let joueurActuelle;

io.on('connection', (socket) => {
    console.log('Un possible joueur arrive');
    socket.emit('actuDamier', { "tour": nbrTour });
    if (nbrTour > 1) {
        socket.emit('ArrivePersonne', (joueurActuelle));
    }
    io.emit('majDamier', (etatDamier));
    socket.on('test', (data) => {
        console.log("Message reçu du client :", data);
        socket.emit('test', { 'quiterepond': 'le serveur !' });
    });

    socket.on('EnvoieJoueurTour', (nom) => {
        joueurActuelle = nom;
    });


    socket.on('stockDamier', (data) => {
        etatDamier = data;
    });

    socket.on('ResetPartie', () => {
        nomsJoueurs = [];
        nbJoueurs = 0;
        tour = 0;
        nbrTour = 0;
        etatDamier = [];
        joueurActuelle = null;
        io.emit('ResetDamier');
    })

    socket.on('entree', (data) => {
        if (nbJoueurs < 2) {
            nomsJoueurs.push(data.nom);
            io.emit('nouveauJoueur', data.nom);
            console.log("Liste des joueurs actuelle : " + nomsJoueurs);
            nbJoueurs++;
        }
        if (nbJoueurs == 2) {
            io.emit('pleine');
            nbrTour++;
            var messageSysteme = "Système : La partie commence entre " + nomsJoueurs[0] + " et " + nomsJoueurs[1];
            io.emit('messageRecu', messageSysteme);
            messageSysteme = "Système : " + nomsJoueurs[0] + " jouera BLEUE et " + nomsJoueurs[1] + " jouera ROUGE";
            io.emit('messageRecu', messageSysteme);
            io.emit('tourJoueur', nomsJoueurs[tour]);
        }
    });

    socket.on('sortie', (data) => {
        io.emit("sortieJoueur", data.nom);
        nomsJoueurs = nomsJoueurs.filter(nom => nom != data.nom);
        console.log("Liste des joueurs après départ : " + nomsJoueurs);
        nbJoueurs = nomsJoueurs.length;
    });

    socket.on('hexagone', (data) => {
        if (nomsJoueurs.indexOf(data.nom) != tour) {
            return 0;
        }
        if (!nomsJoueurs.includes(data.nom)) {
            return 0;
        }
        let couleur;
        if (data.nom == nomsJoueurs[0]) {
            couleur = 'blue';
        } else if (data.nom == nomsJoueurs[1]) {
            couleur = 'red';
        }
        io.emit('colorierHexagone', { numero: data.numero, couleur: couleur });
        tour = (tour + 1) % 2;
        nbrTour++;
        io.emit('tourJoueur', nomsJoueurs[tour]);
    });


    socket.on('envoie', (data) => {
        const messageComplet = data.nom + " : " + data.message;
        io.emit('messageRecu', messageComplet);
    });

    socket.on('victoire', (data) => {
        if (data.CouleurGagnante == "red") {
            var couleurVainqueur = nomsJoueurs[1];
        }
        if (data.CouleurGagnante == "blue") {
            var couleurVainqueur = nomsJoueurs[0];
        }
        var messageVictoire = "Système : Bravo à " + couleurVainqueur + " qui remporte la victoire !";
        socket.emit('messageRecu', messageVictoire);
    });

});

