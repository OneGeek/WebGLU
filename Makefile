JSDOC	= external/jsdoc-toolkit/
JAVA 	= java -jar
JARFILE = $(JSDOC)jsrun.jar
RUNFILE = $(JSDOC)app/run.js
TEMPL	= $(JSDOC)templates/jsdoc
DOC_CMD = $(JAVA) $(JARFILE) $(RUNFILE)
SRC_DIR = src/
MODULES	= webglu Util Object Material Texture Animation Constants gameglu ControlProfiles DefaultUniformActions Framebuffer GLSL GLU Renderer
SOURCES = $(addprefix $(SRC_DIR), $(addsuffix .js, $(MODULES)))
DEST 	= doc
DFLAGS	= -t=$(TEMPL) -d=$(DEST) -v

docs:
	 $(DOC_CMD) $(SOURCES) $(DFLAGS)

clean:
	rm -r $(DEST)/symbols
	rm $(DEST)/files.html
	rm $(DEST)/index.html
