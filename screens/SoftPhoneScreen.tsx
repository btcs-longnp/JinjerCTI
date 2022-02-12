import {
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  View,
  Text,
} from 'react-native';
import tw, {useDeviceContext} from 'twrnc';
import React, {useState, useRef, useEffect} from 'react';
// import { Ionicons } from '@expo/vector-icons';

// import { currentUserState } from '../store/currentUserStore';
// import { useRecoilValue } from 'recoil';
import {call, answer, terminate} from '../services/asterisk';
import {softPhoneEmitter} from '../services/eventEmitter';
import {CallingState, CallDirection, SoftPhoneState} from '../models/SoftPhone';
import {useRecoilValue} from 'recoil';
import {currentUserState} from '../store/currentUserStore';

export default function TabOneScreen() {
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const keywordInputRef = useRef<TextInput>(null);
  const [simpleSoftPhone, setSimpleSoftPhone] = useState<SoftPhoneState>({
    isRegistered: true,
    currentSession: undefined,
    holdSession: undefined,
  });
  const currentUser = useRecoilValue(currentUserState);

  const handleEndCall = () => {
    terminate();
  };

  const handleCall = () => {
    call(phoneNumber, currentUser?.name || '');
  };

  useEffect(() => {
    softPhoneEmitter.on('message', payload => {
      switch (payload.type) {
        case 'incoming':
          // set state
          setSimpleSoftPhone(val => ({
            ...val,
            currentSession: {
              direction: CallDirection.incoming,
              target: {
                phoneNumber: payload.target,
                displayName: payload.displayName,
                phoneCall: payload.phoneCall,
              },
              isHold: false,
              isMute: false,
            },
          }));
          break;
        case 'progress':
          // set state
          setSimpleSoftPhone(val => ({
            ...val,
            currentSession: {
              ...val.currentSession,
              state: CallingState.progress,
              direction: payload.direction,
              target: {
                phoneNumber: payload.target.phoneNumber,
                displayName: 'Long',
                phoneCall: 'Long',
              },
            },
          }));
          break;
        case 'confirmed':
          // set state
          setSimpleSoftPhone(val => ({
            ...val,
            currentSession: {
              ...val.currentSession,
              startTime: new Date(),
              state: CallingState.confirmed,
            },
          }));
          break;
        case 'failed':
          // xac dinh xem session nay la current session hay hold session
          // set state, clear UI
          if (payload.btc?.sessionType === 'currentSession') {
            setSimpleSoftPhone(val => ({
              ...val,
              currentSession: undefined,
            }));
          } else if (payload.btc?.sessionType === 'holdSession') {
            setSimpleSoftPhone(val => ({
              ...val,
              holdSession: undefined,
            }));
          }
          break;
        case 'ended':
          // xac dinh xem session nay la current session hay hold session
          // set state, clear UI
          if (payload.btc?.sessionType === 'currentSession') {
            setSimpleSoftPhone(val => ({
              ...val,
              currentSession: undefined,
            }));
          } else if (payload.btc?.sessionType === 'holdSession') {
            setSimpleSoftPhone(val => ({
              ...val,
              holdSession: undefined,
            }));
          }
          break;
        case 'accepted':
          // set state, clear UI
          break;
        case 'hold':
          setSimpleSoftPhone(val => ({
            ...val,
            holdSession: {
              ...val.currentSession,
              isHold: !val.currentSession?.isHold,
            },
            currentSession: undefined,
          }));
          break;
        case 'unhold':
          setSimpleSoftPhone(val => ({
            ...val,
            currentSession: {
              ...val.holdSession,
              isHold: !val.holdSession?.isHold,
            },
            holdSession: undefined,
          }));
          break;
        case 'mute':
          setSimpleSoftPhone(val => ({
            ...val,
            currentSession: {...val.currentSession, isMute: true},
          }));
          break;
        case 'unmute':
          setSimpleSoftPhone(val => ({
            ...val,
            currentSession: {...val.currentSession, isMute: false},
          }));
          break;
        case 'notification':
          break;
      }
    });

    return () => {
      softPhoneEmitter.removeAllListeners('message');
    };
  }, []);

  useEffect(() => {
    console.log('simpleSoftPhone', simpleSoftPhone);
  }, [simpleSoftPhone]);

  useDeviceContext(tw);

  const handleChangePhoneNumber = (text: string) => {
    setPhoneNumber(text);
  };

  const focusKeywordInput = () => {
    if (keywordInputRef.current != null) {
      keywordInputRef.current.focus();
    }
  };

  return (
    <View style={tw`h-full`}>
      <View style={tw`flex flex-1`}>
        <ScrollView>
          <View style={tw`h-18 w-full bg-transparent`} />
          <View
            style={tw`mt-8 flex flex-row items-center justify-center h-12 rounded-xl border border-red-400 dark:border-red-800 mx-4`}
            onTouchStart={focusKeywordInput}>
            <TextInput
              style={tw`w-full h-full px-3`}
              ref={keywordInputRef}
              placeholder="Phone number"
              onChangeText={handleChangePhoneNumber}
              value={phoneNumber}
            />
          </View>
          <View style={tw`h-16 w-full bg-transparent`} />
        </ScrollView>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`absolute bottom-0 w-full`}>
        <View style={tw`px-4 py-3`}>
          <Pressable
            style={tw`flex flex-row items-center justify-center h-12 rounded-xl bg-red-400 dark:bg-red-800 shadow`}
            onPress={handleCall}>
            <Text>Call</Text>
          </Pressable>
        </View>
        <View style={tw`px-4 py-3`}>
          <Pressable
            style={tw`flex flex-row items-center justify-center h-12 rounded-xl bg-red-400 dark:bg-red-800 shadow`}
            onPress={answer}>
            <Text>Anwser</Text>
          </Pressable>
        </View>
        <View style={tw`px-4 py-3`}>
          <Pressable
            style={tw`flex flex-row items-center justify-center h-12 rounded-xl bg-red-400 dark:bg-red-800 shadow`}
            onPress={handleEndCall}>
            <Text>Terminate</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <View
        style={tw`absolute w-full top-0 h-18 flex justify-end items-end pb-2 px-4`}>
        <View
          style={tw`flex flex-row w-full justify-between items-center bg-transparent`}>
          <View style={tw`flex flex-row items-center bg-transparent`}>
            <Text style={tw`ml-2 text-gray-600 dark:text-gray-200`}>
              Infini.
            </Text>
          </View>
          <View style={tw`flex flex-row bg-transparent`}>
            <Text
              style={tw`text-base font-semibold text-gray-600 dark:text-gray-200`}>
              isling
            </Text>
            <View
              style={tw`w-6 h-6 rounded-full bg-red-400 dark:bg-red-800 ml-1`}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
