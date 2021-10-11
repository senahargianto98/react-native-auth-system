import * as React from 'react';
import {Button, Text, TextInput, View, StyleSheet, Alert} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AuthContext = React.createContext();

function SplashScreen() {
  return (
    <View>
      <Text style={style.text}>Loading...</Text>
    </View>
  );
}

function HomeScreen() {
  const {signOut} = React.useContext(AuthContext);
  return (
    <View>
      <Text style={style.text}>Signed in!</Text>
      <Button title="Sign out" onPress={signOut} />
    </View>
  );
}

function SignInScreen() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const {signIn} = React.useContext(AuthContext);

  return (
    <View style={style.viewForm}>
      <TextInput
        style={style.textInput}
        placeholder="Username"
        value={username} 
        onChangeText={setUsername}
      />
      <TextInput
        style={style.textInput}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title="Sign in" onPress={() => signIn({username, password})} />
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function App({navigation}) {
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.token,
            isLoading: false,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.token,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
    },
  );

  React.useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken;
      try {
        userToken = await AsyncStorage.getItem('userToken');
      } catch (e) {}
      dispatch({type: 'RESTORE_TOKEN', token: userToken});
    };

    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(() => ({
    signIn: async data => {
      try {
        const postdata = {email: data.username, password: data.password};
        const axiosConfig = {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        };
        const response = await axios.post(
          'http://192.168.1.12:8000/api/login',
          postdata,
          axiosConfig,
        );
        if (response.status === 200) {
          console.log(response.data);
          AsyncStorage.setItem('userToken', response.data.token);
          dispatch({type: 'SIGN_IN', token: response.data.token});
        }
      } catch (error) {
        Alert.alert('Masukkan Password');
      }
    },
    signOut: async => {
      try {
        AsyncStorage.removeItem('userToken');
        dispatch({type: 'SIGN_OUT'});
      } catch (e) {
        console.error(error);
      }
    },
  }));

  if (state.isLoading == true) {
    return (
      <AuthContext.Provider value={authContext}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Splash" component={SplashScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthContext.Provider>
    );
  } else if (state.userToken == null) {
    return (
      <AuthContext.Provider value={authContext}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="SignIn"
              component={SignInScreen}
              options={{
                title: 'Sign in',
                animationTypeForReplace: state.isSignout ? 'pop' : 'push',
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthContext.Provider>
    );
  } else {
    return (
      <AuthContext.Provider value={authContext}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Home" component={HomeScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthContext.Provider>
    );
  }
}

export const style = StyleSheet.create({
  viewForm: {
    flex: 2,
    padding: 10,
    justifyContent: 'center',
  },
  text: {
    color: 'black',
  },
  textInput: {
    padding: 10,
    fontSize: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    marginBottom: 10,
    backgroundColor: '#dedede',
  },
  button: {
    paddingRight: 60,
    paddingLeft: 60,
  },
});
