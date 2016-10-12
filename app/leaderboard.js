/**
 * Created by reedvilanueva on 10/11/16.
 */

PlayersList = new Mongo.Collection('players');



if(Meteor.isClient){
  console.log("Hello client");

  // This helpers keyword is a special keyword that allows us to define multiple
  //   helper functions inside a single block of code.
  Template.leaderboard.helpers({
    'player': function(){
      // SomeCollection.find({selector}, {options})
      //   @param {MongoSelector} [selector] A query describing the documents to find
      //   @param {Object} [options]
      return PlayersList.find({}, {sort: {score: -1, name: 1}});  //find all docs and sort by descending scores and normal alpha
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
      console.log('click an .player element');
      //  we have a reference to this, and as is always the case in JavaScript,
      //   the value of this depends on the context. In this particular case,
      //   this refers to the Mongo document of the player that has just been clicked.
      let playerId = this._id;

      // set a session name and value. Note: There can only be one value stored inside
      //   a single session, so each time a new value is stored, the previous value is overwritten.
      Session.set('selectedPlayer', playerId);
      let selectedPlayer = Session.get('selectedPlayer');
      console.log(selectedPlayer);
    },

    'click .increment': function(){
      let selectedPlayer = Session.get('selectedPlayer');

      // SomeCollection.update(selector, modifier)
      //   selector - Specifies which documents to modify
      //   modifier - Specifies how to modify the documents
      PlayersList.update({_id: selectedPlayer}, {$inc: {score: 5}});
      // NOTE: W/out using ops. like $set{: {..}} of inc${: {..}} the update function works
      //   by deleting the original document that’s being updated and then creating
      //   an entirely new document with the data that we specify (except for _id).
    },

    'click .decrement': function() {
      let selectedPlayer = Session.get('selectedPlayer');
      PlayersList.update({_id: selectedPlayer}, {$inc: {score: -5}})
    },

    'click .remove': function() {
      let selectedPlayer = Session.get('selectedPlayer');
      PlayersList.remove({_id: selectedPlayer});
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

      // add this new player to the PlayerList collection
      PlayersList.insert({
        name: playerNameVal,
        score: 0
      });

      // clear the form
      event.target.playerName.value = "";
    }
  });

}


if(Meteor.isServer){
  console.log("Hello server");

}

