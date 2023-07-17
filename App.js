import React, {useState, useRef, useEffect, useReducer} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  PermissionsAndroid,
  SafeAreaView,
  ToastAndroid,
  Linking,
  Alert,
  NativeModules,
} from 'react-native';
import {
  Camera,
  FileSystem,
  CameraRecordingQuality,
  useCameraDevices,
} from 'react-native-vision-camera';
import Video from 'react-native-video';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';

const App = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [videoPath, setVideoPath] = useState('');
  const [showText, setShowText] = useState(false);
  const [hideVideo, setHideVideo] = useState(false);
  const cameraRef = useRef();
  const devices = useCameraDevices('wide-angle-camera');
  const device = devices.back;

  const openSettings = () => {
    Linking.openSettings();
  };

  const recordComplete = path => {
    Alert.alert('Do you want to save this video?', '', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Save',
        onPress: () => {
          CameraRoll.save(path);
          ToastAndroid.showWithGravity(
            'Video Saved to storage',
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
          );
        },
      },
    ]);
  };

  useEffect(() => {
    const getPermissions = async () => {
      if (Platform.OS === 'android') {
        try {
          const userResponse = await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            PermissionsAndroid.PERMISSIONS.CAMERA,
          ]);
          console.log('userResponse', userResponse);
          if (
            userResponse[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] ===
              PermissionsAndroid.RESULTS.GRANTED &&
            userResponse[PermissionsAndroid.PERMISSIONS.CAMERA] ===
              PermissionsAndroid.RESULTS.GRANTED
          )
            setPermissionGranted(true);
          else {
            Alert.alert(
              'Video and Audio Record Permission Required',
              'App needs access to record your video and audio. Please go to app settings and grant permission.',
              [
                {text: 'Cancel', style: 'cancel'},
                {text: 'Open Settings', onPress: openSettings},
              ],
            );
          }
        } catch (error) {
          Alert.alert(
            'Video and Audio Record Permission Required',
            'App needs access to record your video and audio. Please go to app settings and grant permission.',
            [
              {text: 'Cancel', style: 'cancel'},
              {text: 'Open Settings', onPress: openSettings},
            ],
          );
        }
      }
    };
    getPermissions();
  }, []);

  const stopRecording = async () => {
    setIsRecording(false);
    try {
      const recording = await cameraRef.current?.stopRecording();
      console.log('Recording stopped');
    } catch (error) {
      console.warn(error);
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    try {
      const options = {
        // quality: '720p',
        // flash: 'auto',
        // fileType: 'mp4',
        // onRecordingError: error => console.warn(error),
        // onRecordingFinished: () => {
        //   stopRecording();
        // },
        onRecordingFinished: video => {
          clearInterval(interval);
          setVideoPath(video?.path);
          recordComplete(String(video?.path));
        },
        onRecordingError: error => console.error(error),
        videoCodec: 'H264',
      };
      const recording = await cameraRef.current?.startRecording(options);
      const interval = setInterval(() => {
        setShowText(showText => !showText);
      }, 1000);
    } catch (error) {
      console.warn(error);
    }
  };

  const pauseRecording = async () => {
    setIsRecordingPaused(true);
    await camera.current.pauseRecording();
    await timeout(500);
  };

  const resumeRecording = async () => {
    setIsRecordingPaused(false);
    await camera.current.resumeRecording();
    await timeout(2000);
  };

  if (device == null)
    return <ActivityIndicator size="large" style={{flex: 1}} />;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#7b4e80'}}>
      <View style={styles.container}>
        <Camera
          style={StyleSheet.absoluteFill}
          ref={cameraRef}
          isActive={true}
          device={device}
          video={true}
          audio={true}
          setIsPressingButton={true}
        />
        {showText && (
          <Text
            style={{
              color: 'red',
              textAlign: 'center',
              marginTop: 20,
              fontWeight: 'bold',
              fontSize: 24,
            }}>
            &#x2022; Recording
          </Text>
        )}
        {isRecording ? (
          <TouchableOpacity style={styles.recordButton} onPress={stopRecording}>
            <Text style={styles.recordButtonText}>Stop</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.recordButton}
            onPress={startRecording}>
            <Text style={styles.recordButtonText}>Start</Text>
          </TouchableOpacity>
        )}

        {videoPath !== '' && (
          <View style={hideVideo ? {display: 'none'} : styles.videoContainer}>
            <Video
              source={{uri: videoPath}}
              style={styles.videoPlayer}
              onEnd={() =>
                setTimeout(() => {
                  NativeModules.DevSettings.reload();
                }, 2000)
              }
              useNativeControls
              fullscreen={true}
              resizeMode="cover"
              controls
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  recordButton: {
    position: 'absolute',
    left: 150,
    bottom: 20,
    backgroundColor: 'red',
    padding: 25,
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  recordButtonText: {
    paddingTop: 5,
    fontSize: 18,
    color: '#fff',
  },
  videoPlayer: {
    flex: 1,
  },
  videoContainer: {
    flex: 1,
  },
});

export default App;
