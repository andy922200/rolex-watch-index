import axios, { AxiosRequestConfig, AxiosResponse } from 'axios' // Original Axios
import { Ref, ref } from 'vue'

import { axiosInstance } from '@/plugins/axios' // Custom Axios

export enum Method {
  GET = 'get',
  POST = 'post',
}

type FetchResult<TResponse, TRequestData, TParams> = [
  AxiosResponse<TResponse, TRequestData, object, TParams> | null,
  unknown,
]

type GetRequestOptions<TParams, TRequestData> = {
  url: string
  params?: TParams
  config?: AxiosRequestConfig<TRequestData, TParams>
  isAbsolutePath: boolean
}

type PostRequestOptions<TParams, TRequestData> = {
  url: string
  data?: TRequestData
  config?: AxiosRequestConfig<TRequestData, TParams>
  isAbsolutePath: boolean
}

type FetchDataOptions<TParams, TRequestData> = {
  url: string
  params?: TParams
  data?: TRequestData
  config?: AxiosRequestConfig<TRequestData, TParams>
  method: Method
  isAbsolutePath?: boolean
}

const getRequest = async <TResponse, TParams, TRequestData>({
  url,
  params,
  config,
  isAbsolutePath,
}: GetRequestOptions<TParams, TRequestData>): Promise<
  FetchResult<TResponse, TRequestData, TParams>
> => {
  try {
    const requestConfig = { ...config, params }
    const res = isAbsolutePath
      ? await axios.get<
          TResponse,
          AxiosResponse<TResponse, TRequestData, object, TParams>,
          TRequestData,
          TParams
        >(url, requestConfig)
      : await axiosInstance.get<
          TResponse,
          AxiosResponse<TResponse, TRequestData, object, TParams>,
          TRequestData,
          TParams
        >(url, requestConfig)

    return [res, null]
  } catch (err) {
    return [null, err]
  }
}

const postRequest = async <TResponse, TParams, TRequestData>({
  url,
  data,
  config,
  isAbsolutePath,
}: PostRequestOptions<TParams, TRequestData>): Promise<
  FetchResult<TResponse, TRequestData, TParams>
> => {
  try {
    const res = isAbsolutePath
      ? await axios.post<
          TResponse,
          AxiosResponse<TResponse, TRequestData, object, TParams>,
          TRequestData,
          TParams
        >(url, data, config)
      : await axiosInstance.post<
          TResponse,
          AxiosResponse<TResponse, TRequestData, object, TParams>,
          TRequestData,
          TParams
        >(url, data, config)

    return [res, null]
  } catch (err) {
    return [null, err]
  }
}

export const useFetchData = async <
  TResponse = unknown,
  TParams = Record<string, unknown>,
  TRequestData = Record<string, unknown>,
>({
  url,
  params,
  data,
  config,
  method,
  isAbsolutePath = false,
}: FetchDataOptions<TParams, TRequestData>): Promise<{
  isFetching: Ref<boolean>
  result: FetchResult<TResponse, TRequestData, TParams>
}> => {
  const isFetching = ref(false)

  try {
    isFetching.value = true

    const result =
      method === Method.GET
        ? await getRequest<TResponse, TParams, TRequestData>({
            url,
            params,
            config,
            isAbsolutePath,
          })
        : await postRequest<TResponse, TParams, TRequestData>({ url, data, config, isAbsolutePath })

    return {
      isFetching,
      result,
    }
  } finally {
    isFetching.value = false
  }
}
