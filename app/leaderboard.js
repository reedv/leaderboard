/**
 * Created by reedvilanueva on 10/11/16.
 */

PlayersList = new Mongo.Collection('players');



if(Meteor.isClient){
  console.log("Hello client");

  // need to explicitly subcribe to a collection (when 'autopublish' pkg removed)
  Meteor.subscribe('thePlayers');

  // This helpers keyword is a special keyword that allows us to define multiple
  //   helper functions inside a single block of code.
  Template.leaderboard.helpers({
    'player': function(){
      let currentUserId = Meteor.userId();
      // SomeCollection.find({selector}, {options})
      //   @param {MongoSelector} [selector] A query describing the documents to find
      //   @param {Object} [options]
      return PlayersList.find({createdBy: currentUserId},  // find docs createdBy currentUser..
                              {sort: {score: -1, name: 1}});  // ..and sort by descending scores and normal alpha
    },

    // because the “selectedClass” function is being executed from inside the each block,
    //   it has access to all of the data associated with each document
    'selectedClass': function() {
      let playerId = this._id;
      let selectedPlayer = Session.get('selectedPlayer');

      // check that the _id of this player document matches the _id currently
      //   stored in our selectedPlayer session (see Template.leaderboard.events)
      if(playerId == selectedPlayer) {
        // return the specified CSS class
        return 'selected';
      }
    },

    'selectedPlayer': function() {
      let selectedPlayer = Session.get('selectedPlayer');
      return PlayersList.findOne({_id: selectedPlayer});  // better performance when only need single doc.
    },

  });


  Template.leaderboard.events({
    // w/out the event selector (here, class '.player'), the this event would be triggered if
    //   we trigger the event (in this case 'click') from anywhere in the leaderboard template
    'click .player' : function() {
      //  we have a reference to this, and as is always the case in JavaScript,
      //   the value of this depends on the context. In this particular case,
      //   this refers to the Mongo document of the player that has just been clicked.
      let playerId = this._id;

      // set a session name and value. Note: There can only be one value stored inside
      //   a single session, so each time a new value is stored, the previous value is overwritten.
      Session.set('selectedPlayer', playerId);

      // let selectedPlayer = Session.get('selectedPlayer');
      // console.log(selectedPlayer);
    },

    'click .increment': function(){
      let selectedPlayer = Session.get('selectedPlayer');
      const amount = 5;
      const  currScore = PlayersList.findOne(selectedPlayer).score;
      const MAX = 1000000000;

      if(!(currScore+amount > MAX)) {
        Meteor.call('updateScore', selectedPlayer, currScore, amount);
      }
    },

    'click .decrement': function() {
      let selectedPlayer = Session.get('selectedPlayer');
      const amount = -5;
      const currScore = PlayersList.findOne(selectedPlayer).score;

      Meteor.call('updateScore', selectedPlayer, currScore, amount);
    },

    'click .remove': function() {
      let selectedPlayer = Session.get('selectedPlayer');
      Meteor.call('removePlayer', selectedPlayer);
    }
  });



  Template.addPlayerForm.events({
    // using 'submit' event for form is better than 'click', since forms can be submitted in many ways
    'submit form': function(event) {  // whatever keyword is passed as 1st arg becomes ref. for the event
      // prevent default browser behavior for this event (in this case, stop from reloading)
      event.preventDefault();

      // references the event to grab whatever HTML element has its name attribute
      //   defined as “playerName”
      let playerNameVal = event.target.playerName.value;  // need to excplicitly retrive value of the form field

      // Note on optimistic ui:  when the “createPlayer” method is executed on the client,
      //   Meteor “guesses” what the method is trying to do on the server and instantly reflects
      //   those changes from inside the browser.
      Meteor.call('createPlayer', playerNameVal);

      // clear the form
      event.target.playerName.value = "";
    }
  });

}


if(Meteor.isServer){
  console.log("Hello server");

  Meteor.publish('thePlayers', function() {
    // called on the server each time a client subscribes to the named record set

    // only return docs. created by the current client user subscribing
    let currentPlayerId = this.userId;  // can't use Meteor.userId here
    return PlayersList.find({createdBy: currentPlayerId});
  });
}


// methods are simply blocks of code that can be triggered from elsewhere in an application
Meteor.methods({
  'createPlayer': function(playerNameVal) {
    // get this funciton by adding the 'check' pkg
    check(playerNameVal, String);

    // function provided by the login provider package, allows to retrieve unique ID of currently logged-in user
    let currentUserId = Meteor.userId();

    // check that user accessing this method is logged in
    if(currentUserId && playerNameVal != "" && playerNameVal != "''") {
      // add this new player to the PlayerList collection
      PlayersList.insert({
        name: playerNameVal,
        score: 0,
        createdBy: currentUserId
      });
    }
  },

  'removePlayer': function(selectedPlayer) {
    check(selectedPlayer, String);
    let currentUserId = Meteor.userId();
    if(currentUserId) {
      // should only be able to remove docs. associated with the currentUser
      PlayersList.remove({ _id: selectedPlayer, createdBy: currentUserId });
    }
  },

  'updateScore': function(selectedPlayer, currScore, amount) {
    check(selectedPlayer, String);
    check(amount, Number);

    const MAX = 1000000000;
    let currentUserId = Meteor.userId();
    let change = currScore + amount;
    if(currentUserId &&
        (0 < change) && (change > MAX)) {
      // SomeCollection.update(selector, modifier)
      //   selector - Specifies which documents to modify
      //   modifier - Specifies how to modify the documents
      PlayersList.update({ _id: selectedPlayer, createdBy: currentUserId },
                         { $inc: { score: amount } });
    }

    // NOTE: W/out using ops. like $set{: {..}} of inc${: {..}} the update function works
    //   by deleting the original document that’s being updated and then creating
    //   an entirely new document with the data that we specify (except for _id).
  },


});