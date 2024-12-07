# Architecture

```lua
+---------------------------------------------------------------------------------------------------+
|                                     Google Cloud Platform                                         |
| Region: asia-southeast2                                                                          |
| Zone: asia-southeast2-b                                                                          |
|                                                                                                   |
|  +-------------+       +------------------+          +------------------+        +-------------+ |
|  |  Pengguna   | ----> |  Front-end       |  ---->   | Web Server/API   |  --->  |  Firestore  | |
|  +-------------+       |  App Engine      |          | Compute Engine   |        | Prediction  | |
|                        |  Standard Env.   |          | Virtual Machine  |        | Native Mode | |
|                        +------------------+          +------------------+        +-------------+ |
|                                                                                                   |
|                                        +------------------+                                       |
|                                        |   Cloud Storage   |                                      |
|                                        |   Model Buckets   |                                      |
|                                        +------------------+                                       |
+---------------------------------------------------------------------------------------------------+

```

# 1. Predict

- URL Endpoint: /predict
- Method: POST
- Content-Type: multipart/form-data
- Request body:
  image as file, harus berukuran maksimal 1MB (1000000 byte)
- Response :

        ```json
            {
          "status": "success",
          "message": "Model is predicted successfully",
          "data": {
              "id": "77bd90fc-c126-4ceb-828d-f048dddff746",
              "result": "Cancer",
              "suggestion": "Segera periksa ke dokter!",
              "createdAt": "2023-12-22T08:26:41.834Z"
          }
        }
        ```

lskafjlwejf aosijdflaskdfjoawefhoalskdfjh
