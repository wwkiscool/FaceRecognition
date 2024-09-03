<template>
  <div class="content_video">
    <div class="face" :class="{ borderColor: borderColor }">
      <p class="tip" style="font-size: 24px; color: blue; text-align: center">
        {{ tip }}
      </p>
      <div class="face-meiti" id="container">
        <video
          ref="video"
          preload
          autoplay
          loop
          muted
          playsinline
          :webkit-playsinline="true"
        ></video>
        <canvas ref="canvas"> </canvas>
        <img :src="src" alt="">
      </div>
    </div>
    <button @click="init">开始识别</button>
    <button @click="initHuoti">活体监测</button>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue"
const borderColor = ref(false)
// import { useRouter } from "vue-router";
const show = ref(false)
const isIndex = ref(true)
const isPhoto = ref(false)
const videoEl = ref()
const localStream = ref()
const timer = ref()
const options = ref([])
const showPicker = ref(false)
const form = reactive({
  workerName: '',
  programName: '',
  programId: ''
})
const vedioOpen = ref(true)
const reJiance = ref(false)
const state = reactive({
  options: '',
  nose_x_anv: '',
  nose_y_anv: '',
  mouth_Y: '',
  action: '张嘴',
  isCheck: true
})

//人脸检测
const tip = ref('请正对摄像头')
const mediaStreamTrack = ref()
const video = ref() //播放器实例
const trackerTask = ref() //tracking实例
const uploadLock = true //上传锁
const faceflag = ref(false) //是否进行拍照
const src = ref()
const getUserMedia = ref('')
const canvas = ref()
// const LorR = computed(() =>
//   store.state.UserInfo.workerName != undefined ? true : false
// )
// const selectPeople = computed(() => store.state.SalarySelectPeople)
// const store = useStore()
//人脸检测区域
const jiance = ref();
const initHuoti = async (rect) => {
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.loadFaceLandmarkModel("/models");
  state.options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.4
  });
 
  //设定定时器，重复获取当前摄像头的图片
  jiance.value = setInterval(() => {
    let context = canvas.value.getContext("2d", { willReadFrequently: true });
    context.strokeStyle = "#a64ceb";
    context.strokeRect(rect.x, rect.y, rect.width, rect.height);
    canvas.value.width = video.value.videoWidth;
    canvas.value.height = video.value.videoHeight;
    context.drawImage(video.value, 0, 0, canvas.value.width, canvas.value.height);
    let base64Img = canvas.value.toDataURL("image/jpeg");
    face_test(base64Img)
  }, 400)
}
  //使用faceapi检测人脸图片的特征值
const face_test = async (base64Img) => {
  const detections1 = await faceapi.detectSingleFace(canvas.value, state.options).withFaceLandmarks();
  if (detections1) {
    const landmarks = detections1.landmarks
    const jawOutline = landmarks.getJawOutline()
    const nose = landmarks.getNose()
    const mouth = landmarks.getMouth()
    const leftEye = landmarks.getLeftEye()
    const rightEye = landmarks.getRightEye()
    const leftEyeBbrow = landmarks.getLeftEyeBrow()
    const rightEyeBrow = landmarks.getRightEyeBrow()
    //将特征值给这个方法检测是否张嘴了
    isOpenMouth(mouth, base64Img)
    const resizedDetections = faceapi.resizeResults(detections1, { width: 280, height: 280 })
    faceapi.draw.drawDetections(canvas.value, resizedDetections)
  }
}
//是否张嘴，精度取决于其中的检测方法
const isOpenMouth = (mouth, base64Img) => {
  const mouth_Y_list = mouth.map((item) => {
    return item.y
  })
  const max = Math.max(...mouth_Y_list)
  const min = Math.min(...mouth_Y_list)
  const _y = max - min
  if (state.mouth_Y === "") {
    state.mouth_Y = _y
  }
  if (Math.abs(state.mouth_Y - _y) > 10) {
    clearTimeout(jiance.value);
    console.log('检测成功，正在拍照', 'info', 1000);
    tip.value = "正在拍照，请勿乱动";
    borderColor.value=false
    src.value = base64Img
    //上传照片
    // uploadimg(base64Img);
  }
  state.mouth_Y = _y
}

const initTracker = async () => {
  const _this = this
  // 固定写法
  let tracker = new window.tracking.ObjectTracker('face')
  tracker.setInitialScale(4)
  tracker.setStepSize(2)
  tracker.setEdgesDensity(0.1)
  //摄像头初始化
  trackerTask.value = window.tracking.track(video.value, tracker, {
    camera: true
  })
  tracker.on('track', async (event) => {
    if (event.data.length == 0) {
      if (!faceflag.value) {
        tip.value = '未检测到人脸'
      }
    } else if (event.data.length > 0) {
      console.log(event.data.length)
      event.data.forEach(async (rect, index) => {
        if (index != 0) {
          return
        }
        // 防抖
        if (!faceflag.value) {
          faceflag.value = true
          tip.value = '请张张嘴'
          //背景更改，提示作用
          borderColor.value = true
          //进入人脸动作检测方法
          initHuoti(rect)
        }
      })
    }
  })
}
const init = async () => {
  // console.log('正在申请摄像头权限', 'info')
  vedioOpen.value = false
  initTracker(canvas.value)
}

</script>

<style>
.content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.logo {
  height: 200rpx;
  width: 200rpx;
  margin-top: 200rpx;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: 50rpx;
}

.text-area {
  display: flex;
  justify-content: center;
}

.title {
  font-size: 36rpx;
  color: #8f8f94;
}
</style>
