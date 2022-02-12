/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * Generated with the TypeScript template
 * https://github.com/react-native-community/react-native-template-typescript
 *
 * @format
 */

import React from 'react';
import {SafeAreaView, StatusBar, useColorScheme, View} from 'react-native';

import {Colors} from 'react-native/Libraries/NewAppScreen';
import {RecoilRoot} from 'recoil';
import AuthZone from './components/AuthZone/AuthZone';
import SoftPhoneScreen from './screens/SoftPhoneScreen';
import tw from 'twrnc';

const App = () => {
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };

  return (
    <RecoilRoot>
      <SafeAreaView style={backgroundStyle}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={tw`h-full`}>
          <View style={tw`h-full`}>
            <AuthZone>
              <SoftPhoneScreen />
            </AuthZone>
          </View>
        </View>
      </SafeAreaView>
    </RecoilRoot>
  );
};

export default App;
