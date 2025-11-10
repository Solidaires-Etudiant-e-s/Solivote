import mysql from 'mysql'

export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()

  const temp = {

  }

  console.log(temp)

  const connection = mysql.createConnection(temp);

  connection.connect()

  return {
    provide: {
      mysql: connection
    }
  }
})