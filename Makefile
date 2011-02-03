JSDOC	= external/jsdoc-toolkit
JAVA 	= java -jar
JARFILE = $(JSDOC)/jsrun.jar
RUNFILE = $(JSDOC)/app/run.js
TEMPL	= $(JSDOC)/templates/codeview
DOC_CMD = $(JAVA) $(JARFILE) $(RUNFILE)
SRC_DIR = src/
MODULES	= webglu Util Object Material Texture Animation Constants gameglu ControlProfiles DefaultUniformActions Framebuffer GLSL GLU Renderer
SOURCES = $(addprefix $(SRC_DIR), $(addsuffix .js, $(MODULES)))
DEST 	= doc
DFLAGS	= -d=$(DEST) -v -t=$(TEMPL) -D="noGlobal:true"

docs:
	 $(DOC_CMD) $(DFLAGS) $(SOURCES)

clean:
	rm -r $(DEST)/symbols
	rm $(DEST)/files.html
	rm $(DEST)/index.html
