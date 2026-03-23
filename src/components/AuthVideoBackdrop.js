import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { StyleSheet, View } from "react-native";
import { TRADING_VIDEO } from "../authVideoSource";
import {
  AUTH_VIDEO_DESAT_GRAY,
  AUTH_VIDEO_OVERLAY,
  AUTH_VIDEO_SHEEN,
  AUTH_VIDEO_VIGNETTE,
} from "../constants/authTheme";

function Overlays() {
  return (
    <>
      <LinearGradient
        colors={AUTH_VIDEO_OVERLAY}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={AUTH_VIDEO_SHEEN}
        locations={[0, 0.22, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={AUTH_VIDEO_VIGNETTE}
        locations={[0.4, 0.78, 1]}
        style={StyleSheet.absoluteFill}
      />
    </>
  );
}

/**
 * Vollflächiges, stummes Loop-Video (`assets/video/trading.mp4`) via expo-video.
 * S/W: neutrales Grau + mixBlendMode "color" (isolierter Stack), darüber neutrale Overlays.
 */
export function AuthVideoBackdrop() {
  const player = useVideoPlayer(TRADING_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <View style={styles.layer} pointerEvents="none">
      <View style={styles.videoStack}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
        <View
          style={[
            StyleSheet.absoluteFill,
            styles.desat,
            { backgroundColor: AUTH_VIDEO_DESAT_GRAY },
          ]}
        />
      </View>
      <Overlays />
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  videoStack: {
    ...StyleSheet.absoluteFillObject,
    isolation: "isolate",
  },
  desat: {
    mixBlendMode: "color",
  },
});
