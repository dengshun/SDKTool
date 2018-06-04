import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

export default new Router({
    routes: [{
            path: '/',
            name: 'indexPage',
            component: require('@/views/index/index').default
        },
        {
            path: '/xmleditor',
            name: "XMLEditor",
            component: require('@/views/xmlEditor/XMLEditor').default
        },
        {
            path: '*',
            redirect: '/'
        }
    ]
})