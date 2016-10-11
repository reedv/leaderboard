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
      return PlayersList.find();
    },

  });

}


if(Meteor.isServer){
  console.log("Hello server");
}

