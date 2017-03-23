import React, { Component } from 'react';
import { View, TextInput, Button, Dimensions } from 'react-native';
import firebase, { User } from 'firebase';
import { connect } from 'react-redux';
import ActionButton from 'react-native-action-button';

import { updateRSVPList, filterRSVPList, addSelfToList } from '../../actions/index';
import { HJListView } from '../../components/index';
import ListItem from './ListItem';
import styles from './styles';
import { IPerson, IFirebaseReducer, IEmptyState, IAuthReducer } from '../../types/interfaces';

interface IProps {
  navigation: any,
  updateUsersList: (users: IPerson[]) => Function,
  loggedIn: boolean,
  user: User,
}

interface IState {
  persons: IPerson[],
  filteredPersons: IPerson[],
  isInTheList: boolean,
}

class MainScreen extends Component<IProps, IState> {

  state = {
    persons: [] as IPerson[],
    filteredPersons: [] as IPerson[],
    isInTheList: false,
  };

  componentDidMount(){
    firebase.database().ref('hackjam-expo/users').on('value', (snap) => {
      const list = snap.val() || [];
      const persons = Object.keys(list).map(el => list[el]);
      const isInTheList = !!persons.find(person => person.uid === this.props.user.uid);
      this.setState({persons, isInTheList, filteredPersons: persons});
    });
  }

  addRemoveFromList = () => {
    if(!this.state.isInTheList){
      this.addToList();
    } else {
      this.removeFromList();
    }
  }

  addToList = () => {
    const { displayName, uid } = this.props.user;
    firebase.database().ref(`hackjam-expo/users/${uid}`).set({
        displayName,
        uid
    });
  }

  removeFromList = () => {
    firebase.database().ref(`hackjam-expo/users/${this.props.user.uid}`).remove();
  }

  componentWillReceiveProps(nextProps: IProps){
    !nextProps.loggedIn && nextProps.navigation.dispatch({
      type: 'Navigation/RESET',
      actions: [{
        type: 'Navigation/NAVIGATE',
        routeName: 'login',
      }], index: 0
    });
  }

  filter = (searchTerm: string): void => {
    this.setState({
        ...this.state,
        filteredPersons: searchTerm ? 
            this.state.persons.filter(person => person.displayName && person.displayName.includes(searchTerm))
            : this.state.persons
    })
  }

  componentWillUnmount(){
    firebase.database().ref('hackjam-expo/users').off();
  }

  render(){
    const {navigation} = this.props;
    return (
      <View style={{flex: 1}}>
        <View>
          <TextInput
            onChangeText={this.filter}
            placeholder="search"
            style={styles.searchField}/>
          <HJListView
            navigation={navigation}
            persons={this.state.filteredPersons}
            renderRow={
              (person) => {
                return <ListItem navigation={this.props.navigation} person={person} />
               }
            } />
        </View>
        <ActionButton 
          active={this.state.isInTheList}
          onPress={this.addRemoveFromList}>
          <ActionButton/>
        </ActionButton>
      </View>
    );
  }
}

// DONT GO BELOW THIS LINE
const mapStateToProps = ({auth: {loggedIn, user}}: {auth: IAuthReducer}) => ({
  loggedIn,
  user,
});

export default connect(mapStateToProps, null)(MainScreen);
