import './index.css';
import nameGenerator from './name-generator';
import isDef from './is-def';
import mqtt from 'mqtt';

class Sensor {
  constructor(id,values,typeData){
    this.id = id;
    this.values = values;
    this.typeData = typeData;
  }
  getID(){
    return this.id;
  }
  getNbValues(){
    return this.values.length;
  }
  getTypeData(){
    return this.typeData;
  }
  getMoyenneValue(){
    let somme = this.values.reduce(function(a,b){ return a+b; });
    let moyenne = somme / this.values.length;
    return moyenne;
  }
  toString(){
    var s = '<th>' + this.id + '</th> <th>&nbsp;&nbsp;&nbsp;</th>  <th>' + this.values;
    //Cas des valeurs convertible en nombre
    if(!isNaN(Number(this._values))) {
      s+= '</th><th>&nbsp;&nbsp;&nbsp;</th><th>' + this.getMoyenneValue() / this.getNbValues() + '</th>';
    }
    else {
      s+= '</th><th></th><th></th>';
    }
    s+= '<th>&nbsp;&nbsp;&nbsp;</th><th>' + this.typeData + '</th>'; 
    return s;
  }
}

// Store/retrieve the name in/from a cookie.
const cookies = document.cookie.split(';');
console.log(cookies)
let wsname = cookies.find(function(c) {
  if (c.match(/wsname/) !== null) return true;
  return false;
});
if (isDef(wsname)) {
  wsname = wsname.split('=')[1];
} else {
  wsname = nameGenerator();
  document.cookie = "wsname=" + encodeURIComponent(wsname);
}

// Set the name in the header
document.querySelector('header>p').textContent = decodeURIComponent(wsname);

//Create a WebSocket connection to the server
const ws = new WebSocket("ws://127.0.0.1:1234");
// We get notified once connected to the server
ws.onopen = (event) => {
  console.log("We are connected.");
};

//se connecter à un serveur MQTT donnée,
var clients  = mqtt.connect('mqtt://127.0.0.1:1234');
//de souscrire a tous les messages de ce serveur,
clients.subscribe('#');
//on crée un tableau dans lequel on va répertorier la liste des capteurs
var liste_Sensors = [];

clients.on('message', function(topic,message){
  //identification du capteur à partir du topic
  var valeur = topic.search('/');//indice du séparateur / dans le topic
  var id_Capteur = topic.substring(valeur+1);//on extrait l'id du capteur
  //valeur du capteur et type de données
  var json = JSON.parse(message);
  var valeurs_Capteurs = json.value;
  var type_donnees = json.type;
  //Compteur et Positionnement dans la liste des capteurs.
  var i, position = -1;
  //Recherche
  for(i = 0; i < liste_Sensors.length; i++)  {
    if(liste_Sensors[i].id === id_Capteur) {
      position = i;
    }
  }
  //Ajout d'un capteur
  if(position === -1){
      var nouveaucapteur;
      nouveaucapteur = new Sensor(id_Capteur,valeurs_Capteurs,type_donnees);
      liste_Sensors.push(nouveaucapteur);
      var elemMessages = document.getElementById('messages');
      var line = document.createElement('tr');
      line.id = id_Capteur;

      //Creation du contenu de la ligne
      line.innerHTML = nouveaucapteur.toString();
      elemMessages.appendChild(line);  
  }else {
    liste_Sensors[position].values = valeurs_Capteurs;
    document.getElementById(id_Capteur).innerHTML = liste_Sensors[position].toString(); 
    
  }
});