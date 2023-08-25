<script setup lang="ts">
// import HelloWorld from './components/HelloWorld.vue'
  import {ref, watch, computed} from 'vue'
  import {NInput, NButton, NTag, NPopconfirm, NSelect, NInputNumber, NRadioGroup, NRadio, NSpace, NUpload} from 'naive-ui'
  import type { UploadFileInfo } from 'naive-ui';

  
    chrome.storage.local.get('version').then((v)=>{
      console.log(v)
    })
  const tip = ref('')
  watch(()=>tip.value, (v)=>{
    if (v) {
      setTimeout(() => {
        tip.value = ''
      }, 5000);
    }
  })
  const stage = ref(0) //0 初始 1 新建项目 2 编辑项目 3 进入项目
  type projectType = {
    name: string,
    urlPrefix: string,
    formList: {
      name: string,
      body: Record<string,any>
    }[]
  }
  const projectList = ref<projectType[]>([])
  const emptyProject : projectType = {name: '', urlPrefix: '', formList: []}
  const stageBody = ref<projectType>({...emptyProject})
  const formIndex = ref(0)
  // async function sendmsg() {
  //   const [tab] = await chrome.tabs.query({active: true, currentWindow: true})
  //   chrome.tabs.sendMessage(tab.id, {msg: 'hellow'});
  // }
  
  const currentUrl = ref('')
  async function getUrl() {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true})
    currentUrl.value = tab.url
  }
  getUrl()
  const availableUrl = computed(()=>{
    return currentUrl.value.includes(stageBody.value.urlPrefix)
  })
  chrome.runtime.sendMessage({type: 'get_projectList'})
  chrome.runtime.onMessage.addListener((message)=>{
    console.log(message)
    if (message.projectList)
      projectList.value = message.projectList
    else if (message.msg) {
      tip.value = message.msg
    }
  })

  function newProject(item?: projectType) {
    if (item) {
      stageBody.value = item
      stage.value = 2
    }
    else {
      stageBody.value = {...emptyProject}
      stage.value = 1
    }
    
  }
  async function removeProjcet(i: number) {
    stageBody.value = {...emptyProject}
    projectList.value.splice(i, 1)
    await chrome.runtime.sendMessage({
      type: 'save_project',
      projectList: projectList.value
    })
  }

  async function saveProject() {
    if (projectList.value.some(item=>{
      return item.name == stageBody.value.name
    }) && stage.value == 1) {
      tip.value = '已有'+stageBody.value.name+'项目，您可以删除重名项目或修改项目名称后再添加'
      return
    }
    if (stage.value == 1) {
      projectList.value.push(stageBody.value)
    } 
    await chrome.runtime.sendMessage({
      type: 'save_project',
      projectList: projectList.value
    })
    stage.value = 0
  }

  function enterProject(item: projectType) {
    chrome.runtime.sendMessage({
      type: 'inject_content',
      url: item.urlPrefix
    })
    stageBody.value = item
    stage.value =3
    if (!availableUrl.value) {
      tip.value = '注意：该tab页面不能匹配您设置的url'
    }
  }

  const typeOptions = [
    {label: 'String', value: 0},
    {label: 'Number', value: 1},
    {label: 'Bool', value: 2}
  ]
  type formType = {
    name: string,
    body:Record<string, any>
  }

  type formItemType = {
    key: string,
    type: number,
    value: any
  }
  const formItems = ref<formItemType[]>([])
  const newFormName = ref('')
  // const curForm = computed(()=>{
  //   return formIndex.value !== -1 ? stageBody.value.formList[formIndex.value] : {name: '', body: {}}
  // })
  async function saveForm(item?:formType) {
    let tempForm: formType = {name: '', body:{}}
    if (stage.value == 4) {
      if (newFormName.value == '') {
        tip.value = '您还没输入表单名（仅作为标识）'
        return
      }
      else if (stageBody.value.formList.some(form=>{
        return form.name == newFormName.value
      })) {
        tip.value = '表单名重复了！请修改表单名'
        return
      }
      tempForm.name = newFormName.value
    }
    else {
      tempForm = stageBody.value.formList[formIndex.value]
      tempForm.body = {}
    }
    formItems.value.forEach(item => {
      if (item.key)
        tempForm.body[item.key] = item.value
    })
    if (stage.value == 4) stageBody.value.formList.push(tempForm)
    await chrome.runtime.sendMessage({
      type: 'save_project',
      projectList: projectList.value
    })
    stage.value = 3
    newFormName.value = ''
  }
  function addForm() {
    formIndex.value = -1
    stage.value = 4
    formItems.value.splice(0)
    formItems.value.push({key:'', type: 0, value:''})
    
  }
  async function removeForm(i:number) {
    stageBody.value.formList.splice(i, 1)
    await chrome.runtime.sendMessage({
      type: 'save_project',
      projectList: projectList.value
    })
  }
  function getType(v: any) {
    console.log(typeof(v))
    return typeof(v) == 'number' ? 1: typeof(v) == 'string'? 0 : 2
  }
  function editForm(i: number) {
    formIndex.value = i
    // curForm.value = stageBody.value[formIndex.value]
    formItems.value.splice(0)
    Object.keys(stageBody.value.formList[formIndex.value].body).forEach(item=>{
      formItems.value.push({
        key: item,
        type: getType(stageBody.value.formList[formIndex.value].body[item]),
        value: stageBody.value.formList[formIndex.value].body[item]
      })
    })
    stage.value = 5
  }

  function importJason(options: { fileList: UploadFileInfo[] }) {
    const reader = new FileReader()
    reader.onload = () => {
      console.log(reader.result)
      const tempObj = JSON.parse(reader.result as string)
      Object.keys(tempObj).forEach(item=>{
        formItems.value.push({
          key: item,
          type: getType(tempObj[item]),
          value: tempObj[item]
        })
      })
    }
    if (options.fileList[0].file)
      reader.readAsText(options.fileList[0].file)
  }

  async function sendForm(item: formType) {
    if (!availableUrl.value) return
    await chrome.runtime.sendMessage({
      type: 'form_data',
      data: item,
      url: stageBody.value.urlPrefix
    })
  }
  function test(){
    
  }
</script>

<template>
  <div class="wfull hfull flxC">
    <div class="wfull flxR aiC bcwhite p10 bbox jcSB" style="box-shadow: 0 1px 15px #00000050;" >
      <NTag round @click="test">表单填入工具</NTag>
      <img src="./assets/logo30.png" class="h30" />
    </div>
    <div class="bcgraylight wfull fl1 p20 bbox">
      
      <div v-if="stage == 0" >
        <div class="fs20">项目列表</div>
        <div class="flxR aiC wfull mt20 bb1" v-for="(item, index) in projectList" :key="item.name">
          <div class="csp fs18 fwb w120 taC" :title="item.urlPrefix" @click="enterProject(item)">{{ item.name }}</div>
          <img src="./assets/edit.png" class="csp w16 h16 ml20" @click="newProject(item)"  title="编辑项目"/>
          <n-popconfirm
            negative-text = '取消'
            positive-text="确认"
            @positive-click="removeProjcet(index)"
          >
            <template #trigger>
              <img src="./assets/remove.png" class="csp w16 h16 ml10" title="删除项目"/>
            </template>
           确认删除该项目？
          </n-popconfirm>
        </div>
        <div class="flxR mt20 jcE">
          <img src="./assets/new.png" class="csp w16 h16 ml20" @click="newProject()" title="新增项目"/>
        </div>
      </div>
      <div v-else-if="stage == 1 || stage == 2">
        <div class="fs20 fwb">{{ stage  == 1 ? '新增项目' : '编辑项目'}}</div>
        <NInput v-model:value="stageBody.name" placeholder="输入项目名称" class="mt20" :disabled="stage == 2" />
        <NInput v-model:value="stageBody.urlPrefix" placeholder="输入url前缀" class="mt20" />
        <div class="flxR mt20 jcE">
          <NButton @click="stage = 0">取消</NButton>
          <NButton type="success" class="ml20" @click="saveProject">确定</NButton>
        </div>
        
      </div>
      <div v-else-if="stage ==3">
        <div class="wfull bbox flxR aiC">
          <div class="hred w20 h20 bdr10" @click="stage = 0">
            <img src="./assets/quit.png" class="csp w16 h16" title="退出项目"/>
          </div>
          <div class="fs16 tcgray1">{{ stageBody.name }}</div>
          <div></div>
        </div>
        
        <div class="fs18">表单列表</div>
        <div class="flxR aiC wfull mt20 bb1" v-for="(item, index) in stageBody.formList" :key="item.name">
          <div class="csp fs16 fwb w120 taC" @click="sendForm(item)" >{{ item.name }}</div>
          <img src="./assets/edit.png" class="csp w16 h16 ml20" title="编辑表单" @click="editForm(index)" />
          <n-popconfirm
            negative-text = '取消'
            positive-text="确认"
            @positive-click="removeForm(index)"
          >
            <template #trigger>
              <img src="./assets/remove.png" class="csp w16 h16 ml10" title="删除表单" />
            </template>
           确认删除该表单？
          </n-popconfirm>
        </div>
        <div class="flxR mt20 jcE">
          <img src="./assets/new.png" class="csp w16 h16 ml20" title="新增表单"  @click="addForm" />
        </div>
      </div>
      <div v-else-if="stage == 4 || stage == 5" class="w500">
        <div class="fs16 tcgray1" v-if="formIndex !== -1">{{ stageBody.formList[formIndex].name }}</div>
        <NInput v-else placeholder="输入表单名称" style="width: 150px" v-model:value="newFormName" />
        <div class="flxR wfull jcSB aiC mt5" v-for="(item, index) in formItems" :key="index">
          <div class="w150">
            <NInput placeholder="填入key" v-model:value="item.key" />
          </div>
          <div class="w100">
            <NSelect :options="typeOptions" class="ml10" v-model:value="item.type"  />
          </div>
          <div class="w150">
            <NInput v-if="item.type ==0" class="ml10"  placeholder="填入value" v-model:value="item.value" />
            <NInputNumber v-if="item.type == 1" class="ml10" :show-button="false" placeholder="填入数字"  v-model:value="item.value" :default-value="0" />
            <NRadioGroup v-if="item.type == 2" v-model:value="item.value" class="ml10" :default-value="true">
              <NSpace>
                <NRadio :value="true">true</NRadio>
                <NRadio :value="false">false</NRadio>
              </NSpace>
            </NRadioGroup>
          </div>
          
          
          <img src="./assets/remove.png" class="csp w16 h16 ml10" title="删除本项" @click="formItems.splice(index,1)" />
        </div>
        <div class="flxR mt10 wfull jcE">
          <img src="./assets/new.png" class="csp w16 h16" title="新增项"  @click="formItems.push({key: '', type: 0, value:''})" />
          <div class="w50 ml20">
            <NUpload
              @change="importJason"
              :show-file-list="false"
            >
              <img src="./assets/import.png" class="csp w16 h16" title="导入Json"/>
            </NUpload>
          </div>
        </div>
        <div class="flxR mt20 jcE">
          <NButton @click="stage = 3">取消</NButton>
          <NButton type="success" class="ml20" @click="saveForm">确定</NButton>
        </div>
      </div>
      <div class="tcred wfull bcwhite transShow p5 bbox bdr4 flxR jcSB mt20" v-if="tip">
        {{ tip }}
        <img src="./assets/remove.png" class="csp w16 h16" @click="tip = ''" title="关闭提示消息"/>
      </div>
    </div>
  
  </div>
  
</template>

<style scoped>
  .hred :hover {
    background-color: rgb(150, 9, 9);
  }

  @keyframes op {
    from {opacity: 0;}
    to {opacity: 1;}
  }

  .transShow {
    animation: op 0.5s ease-in;
  }
</style>
