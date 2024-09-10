<template>
  <div class="page">
    <div class="header-container">
      <div class="header">
        <img src="@/assets/images/5.png" alt="" />
        <div>人脸认证</div>
      </div>
    </div>
    <div class="main">
      <div v-show="status == 1" class="content">
        <div class="top">
          <div class="title">为保证本人操作，请进行人脸认证</div>
          <div class="canvas-container">
            <img src="@/assets/images/2.png" alt="" />
          </div>
          <div class="tips">请保证正脸在取景框中并根据屏幕指示完成识</div>
          <div class="tip-icons">
            <div class="item">
              <img src="@/assets/images/1.png" alt="" />
              <div>避免遮挡</div>
            </div>
            <div class="item">
              <img src="@/assets/images/3.png" alt="" />
              <div>光线充足</div>
            </div>
            <div class="item">
              <img src="@/assets/images/4.png" alt="" />
              <div>正对手机</div>
            </div>
          </div>
        </div>
        <div class="bottom" @click="beginVerify">开始验证</div>
      </div>
      <div v-show="status == 2" class="content2">
        <div class="big-title">请张张嘴</div>
        <div class="video">
          <img src="@/assets/images/circle.png" alt="" />
          <video
            ref="video"
            preload
            autoplay
            loop
            muted
            playsinline
            :webkit-playsinline="true"
          ></video>
        </div>

        <canvas ref="canvas" style="display: none"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
const status = ref(1) // 默认是没有验证状态
const vedioOpen = ref(true)
const trackerTask = ref() //tracking实例
const uploadLock = true //上传锁
const tip = ref('请正对摄像头')
const faceflag = ref(false) //是否进行拍照
const src = ref()
const video = ref() //播放器实例
const getUserMedia = ref('')
const canvas = ref()
const state = reactive({
  options: '',
  nose_x_anv: '',
  nose_y_anv: '',
  mouth_Y: '',
  action: '张嘴',
  isCheck: true
})

const jiance = ref()
//是否张嘴，精度取决于其中的检测方法
const isOpenMouth = (mouth, base64Img) => {
  const mouth_Y_list = mouth.map((item) => {
    return item.y
  })
  const max = Math.max(...mouth_Y_list)
  const min = Math.min(...mouth_Y_list)
  const _y = max - min
  if (state.mouth_Y === '') {
    state.mouth_Y = _y
  }
  if (Math.abs(state.mouth_Y - _y) > 10) {
    clearTimeout(jiance.value)
    console.log('检测成功，正在拍照', 'info', base64Img)
    tip.value = '正在拍照，请勿乱动'
    src.value = base64Img
    //上传照片
    // uploadimg(base64Img);
  }
  state.mouth_Y = _y
}
//使用faceapi检测人脸图片的特征值
const face_test = async (base64Img) => {
  const detections1 = await faceapi
    .detectSingleFace(canvas.value, state.options)
    .withFaceLandmarks()
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
    const resizedDetections = faceapi.resizeResults(detections1, {
      width: 280,
      height: 280
    })
    faceapi.draw.drawDetections(canvas.value, resizedDetections)
  }
}
const initHuoti = async (rect) => {
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
  await faceapi.loadFaceLandmarkModel('/models')
  state.options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold: 0.4
  })

  //设定定时器，重复获取当前摄像头的图片
  jiance.value = setInterval(() => {
    let context = canvas.value.getContext('2d', { willReadFrequently: true })
    context.strokeStyle = '#a64ceb'
    context.strokeRect(rect.x, rect.y, rect.width, rect.height)
    canvas.value.width = video.value.videoWidth
    canvas.value.height = video.value.videoHeight
    context.drawImage(
      video.value,
      0,
      0,
      canvas.value.width,
      canvas.value.height
    )
    let base64Img = canvas.value.toDataURL('image/jpeg')
    face_test(base64Img)
  }, 400)
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
      event.data.forEach(async (rect, index) => {
        if (index != 0) {
          return
        }
        // 防抖
        if (!faceflag.value) {
          faceflag.value = true
          tip.value = '请张张嘴'
          //进入人脸动作检测方法
          initHuoti(rect)
        }
      })
    }
  })
}
const init = async () => {
  vedioOpen.value = false
  initTracker(canvas.value)
}
const beginVerify = () => {
  // 开始验证
  status.value = 2
  init()
}
</script>

<style scoped>
.main {
  padding: 15px;
  flex: 1;
}
.content2 {
  background: #ffffff;
  border-radius: 12px;
  min-height: 80%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
}
.content2 .big-title {
  font-weight: 600;
  font-size: 24px;
  color: #202020;
  margin-bottom: 35px;
}
.content2 .video {
  position: relative;
  width: 232px;
  height: 232px;
}
.content2 img {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
}
.content2 video {
  width: calc(100% - 10px);
  height: calc(100% - 10px);
  position: absolute;
  top:0;
  left: 0;
  z-index: 2;
}
.content {
  background: #ffffff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  padding: 20px;
}
.top {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
}
.top .title {
  font-weight: 600;
  font-size: 18px;
  color: #202020;
  margin-bottom: 25px;
}
.canvas-container {
  margin-bottom: 25px;
}
.canvas-container img {
  width: 150px;
  height: 150px;
}
.tips {
  font-weight: 400;
  font-size: 13px;
  color: #202020;
  margin-bottom: 45px;
}
.tip-icons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 70%;
  margin-bottom: 200px;
}
.tip-icons .item {
  display: flex;
  flex-direction: column;
}
.tip-icons .item div {
  font-weight: 400;
  font-size: 13px;
  color: #999999;
}
.tip-icons .item img {
  width: 50px;
  height: 50px;
  margin-bottom: 7px;
}
.bottom {
  flex-shrink: 0;
  height: 42px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #1792ff;
  border-radius: 4px;
  font-weight: 500;
  font-size: 16px;
  color: #ffffff;
  width: 100%;
  margin: 0 auto;
}
.page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: #f8f8f8;
}
.header-container {
  flex-shrink: 0;
  padding-top: 10px;
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  background: #fff;
}
.header {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  font-weight: 600;
  font-size: 18px;
  color: #202020;
  height: 44px;
}
.header img {
  position: absolute;
  left: 13px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
}
</style>