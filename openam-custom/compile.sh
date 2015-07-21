#!/bin/bash 

. ../platform.properties

#----------------------------------------------------------
buildClasspath() {
#----------------------------------------------------------
  CLASSPATH=.

  # Add the OpenAM JAR files
  for i in `ls ${OPENAM_WEBAPP_DIR}/WEB-INF/lib/*.jar`
  do
    CLASSPATH=${CLASSPATH}:$i
  done

  # Add the Tomcat JAR files
  for i in `ls ${TOMCAT_LIB_DIR}/*.jar`
  do
    CLASSPATH=${CLASSPATH}:$i
  done

  #echo "CLASSPATH=${CLASSPATH}"
}


#----------------------------------------------------------
compileJava() {
#----------------------------------------------------------
# Compile the Java sources
# This should be done using ant once approved to run on INT
#

  for src_file in `find . -name *.java`
  do
    printf "=====================================================================\n"
    printf "*** Compiling ${src_file}\n"
    ${JAVA_HOME}/bin/javac -classpath ${CLASSPATH} ${src_file} -d ${OPENAM_CLASSES_DIR}
    if [ "$?" -ne "0" ]; then
        echo "*** Error: During compilation"
        exit
    fi
  done
}

buildClasspath
compileJava

