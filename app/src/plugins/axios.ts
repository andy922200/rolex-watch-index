import axios from 'axios'

const baseURL = '/'

const axiosInstance = axios.create({ baseURL })

axiosInstance.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    return config
  },
  function (error) {
    // Do something with request error
    return Promise.reject(error)
  },
)

axiosInstance.interceptors.response.use(
  function (response) {
    // Do something with response
    return response
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error)
  },
)

export { axiosInstance }
