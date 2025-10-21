// app/mediaDemo.tsx
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { VideoView, useVideoPlayer } from "expo-video";
import React, { useMemo } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";

const SAMPLE_VIDEO =
  // Known-good HLS stream from Apple; widely supported on iOS & web (HLS)
  "https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8";

// A simple MP3 that’s fine for demo
const SAMPLE_AUDIO =
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";

export default function MediaDemo(): React.ReactElement {
  /** VIDEO **/
  const videoSrc = useMemo(() => ({ uri: SAMPLE_VIDEO }), []);
  const videoPlayer = useVideoPlayer(videoSrc, (player) => {
    player.loop = true;
    // You can also set: player.muted = false
    // Avoid auto-play; we'll play on button press (user gesture)
  });

  /** AUDIO **/
  const audioSrc = useMemo(() => ({ uri: SAMPLE_AUDIO }), []);
  const audioPlayer = useAudioPlayer(audioSrc); // lazy load on first play
  const audioStatus = useAudioPlayerStatus(audioPlayer); // { isLoaded, playing, duration, position, ... }

  const safeVideoPlay = async () => {
    try {
      await videoPlayer.play();
    } catch (e) {
      console.warn("[mediaDemo] video play error:", e);
    }
  };
  const safeVideoPause = async () => {
    try {
      await videoPlayer.pause();
    } catch (e) {
      console.warn("[mediaDemo] video pause error:", e);
    }
  };

  const safeAudioPlay = async () => {
    try {
      await audioPlayer.play();
    } catch (e) {
      console.warn("[mediaDemo] audio play error:", e);
    }
  };
  const safeAudioPause = async () => {
    try {
      await audioPlayer.pause();
    } catch (e) {
      console.warn("[mediaDemo] audio pause error:", e);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>Media Demo (expo-video + expo-audio)</Text>

      {/* VIDEO */}
      <Text style={styles.section}>Video</Text>
      <View style={styles.card}>
        <VideoView
          style={styles.video}
          player={videoPlayer}
          contentFit="contain"
          allowsFullscreen
          allowsPictureInPicture
          nativeControls // platform controls (play/pause/seek)
        />
        <View style={styles.row}>
          <Button title="Play" onPress={safeVideoPlay} />
          <Button title="Pause" onPress={safeVideoPause} />
        </View>
        <Text style={styles.meta}>Loop: {videoPlayer.loop ? "on" : "off"}</Text>
      </View>

      {/* AUDIO */}
      <Text style={styles.section}>Audio</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <Button title="Play" onPress={safeAudioPlay} />
          <Button title="Pause" onPress={safeAudioPause} />
        </View>
        <Text style={styles.meta}>
          {audioStatus?.isLoaded
            ? `playing: ${audioStatus.playing ? "yes" : "no"}`
            : "idle (tap Play)"}
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  h1: { fontSize: 20, fontWeight: "600", textAlign: "center", marginBottom: 8 },
  section: { fontSize: 16, fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  video: {
    width: "100%",
    height: 200,
    backgroundColor: "#000",
    borderRadius: 8,
  },
  row: { flexDirection: "row", gap: 8, justifyContent: "space-between" },
  meta: { fontSize: 12, color: "#555" },
});